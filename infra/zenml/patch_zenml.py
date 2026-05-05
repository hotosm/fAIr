import os
import re
import sys
from typing import List

_errors: List[str] = []


def fail(msg: str):
    """Record an error that will break the build."""
    print(f"ERROR: {msg}")
    _errors.append(msg)


def patch_sql_zen_store(base_path):
    file_path = os.path.join(base_path, "zen_stores", "sql_zen_store.py")

    if not os.path.exists(file_path):
        fail(f"File not found: {file_path}")
        return

    with open(file_path, "r") as f:
        content = f.read()

    # Enum patch
    if 'POSTGRES = "postgresql"' not in content:
        content = re.sub(
            r'    MYSQL = "mysql"\n    SQLITE = "sqlite"',
            r'    MYSQL = "mysql"\n    SQLITE = "sqlite"\n    POSTGRES = "postgresql"',
            content
        )
        if 'POSTGRES = "postgresql"' in content:
            print("Patched SQLDatabaseDriver enum")
        else:
            fail("Failed to patch SQLDatabaseDriver enum")
            return

    # Engine config patch
    if 'drivername="postgresql+psycopg"' not in content:
        postgres_block = """        elif sql_url.drivername == SQLDatabaseDriver.POSTGRES:
            assert self.database is not None
            assert self.username is not None
            assert self.password is not None
            assert sql_url.host is not None

            if not database:
                database = self.database

            engine_args = {
                "pool_size": self.pool_size,
                "max_overflow": self.max_overflow,
                "pool_pre_ping": self.pool_pre_ping,
            }

            sql_url = sql_url._replace(
                drivername="postgresql+psycopg",
                username=self.username.get_secret_value(),
                password=self.password.get_secret_value(),
                database=database,
            )

            sqlalchemy_ssl_args = {}
            if self.ssl:
                sqlalchemy_ssl_args["sslmode"] = "require"
                if self.ssl_ca:
                     sqlalchemy_ssl_args["sslrootcert"] = self.ssl_ca.get_secret_value()
                if self.ssl_cert:
                     sqlalchemy_ssl_args["sslcert"] = self.ssl_cert.get_secret_value()
                if self.ssl_key:
                     sqlalchemy_ssl_args["sslkey"] = self.ssl_key.get_secret_value()

                sqlalchemy_connect_args.update(sqlalchemy_ssl_args)

"""
        content = re.sub(
            r'        else:\n            raise NotImplementedError\(',
            f'{postgres_block}        else:\n            raise NotImplementedError(',
            content
        )
        if 'drivername="postgresql+psycopg"' in content:
            print("Patched get_sqlalchemy_config for Postgres")
        else:
            fail("Failed to patch get_sqlalchemy_config")
            return

    # URL validation patch
    if 'Invalid Postgres configuration' not in content:
        postgres_validation_block = """        elif sql_url.drivername == SQLDatabaseDriver.POSTGRES:
            if sql_url.username:
                self.username = PlainSerializedSecretStr(sql_url.username)
                sql_url = sql_url._replace(username=None)
            if sql_url.password:
                self.password = PlainSerializedSecretStr(sql_url.password)
                sql_url = sql_url._replace(password=None)
            if sql_url.database:
                self.database = sql_url.database
                sql_url = sql_url._replace(database=None)

            database = self.database
            if not self.username or not self.password or not database:
                raise ValueError(
                    "Invalid Postgres configuration: The username, password and "
                    "database must be set in the URL or as configuration "
                    "attributes",
                )

"""
        content = re.sub(
            r'(        elif sql_url\.drivername == SQLDatabaseDriver\.MYSQL:[\s\S]+?)(        self\.url = str\(sql_url\))',
            r'\1' + postgres_validation_block + r'\2',
            content
        )
        if 'Invalid Postgres configuration' in content:
            print("Patched _validate_url for Postgres")
        else:
            fail("Failed to patch _validate_url")
            return

    with open(file_path, "w") as f:
        f.write(content)


def patch_schemas(base_path):
    schemas_dir = os.path.join(base_path, "zen_stores", "schemas")

    if not os.path.exists(schemas_dir):
        fail(f"Schemas directory not found: {schemas_dir}")
        return

    schema_files = [
        "api_transaction_schemas.py",
        "deployment_schemas.py",
        "pipeline_build_schemas.py",
        "pipeline_run_schemas.py",
        "pipeline_snapshot_schemas.py",
        "run_template_schemas.py",
        "step_run_schemas.py",
    ]

    for schema_file in schema_files:
        file_path = os.path.join(schemas_dir, schema_file)

        if not os.path.exists(file_path):
            fail(f"Missing schema file: {file_path}")
            continue

        with open(file_path, "r") as f:
            content = f.read()

        original_content = content

        if "length=MEDIUMTEXT_MAX_LENGTH" in content:
            content = content.replace("length=MEDIUMTEXT_MAX_LENGTH", "")

        pattern = r'(\.with_variant\(\s*MEDIUMTEXT,\s*"mysql"\s*\))'
        if 'TEXT, "postgresql"' not in content:
            content = re.sub(
                pattern,
                r'\1.with_variant(TEXT, "postgresql")',
                content
            )

        pattern_blob = r'(\.with_variant\(\s*MEDIUMBLOB,\s*"mysql"\s*\))'
        if '.with_variant(LargeBinary(), "postgresql")' not in content:
            content = re.sub(
                pattern_blob,
                r'\1.with_variant(LargeBinary(), "postgresql")',
                content
            )

        if ('TEXT, "postgresql"' in content or "String()" in content) and not re.search(r"from sqlalchemy import.*TEXT", content):
            if "import TEXT" not in content:
                before_import = content
                content = re.sub(r"from sqlalchemy import ", "from sqlalchemy import TEXT, ", content, count=1)
                if content == before_import:
                    fail(f"Failed to add TEXT import to {schema_file}")
                    continue

        if content != original_content:
            with open(file_path, "w") as f:
                f.write(content)
            print(f"Patched {schema_file}")


def patch_schema_utils(base_path):
    file_path = os.path.join(base_path, "zen_stores", "schemas", "schema_utils.py")

    if not os.path.exists(file_path):
        fail(f"File not found: {file_path}")
        return

    with open(file_path, "r") as f:
        content = f.read()

    if "import hashlib" not in content:
        content = re.sub(r"from typing import", "import hashlib\nfrom typing import", content, count=1)

    new_fk_function = """def foreign_key_constraint_name(
    source: str, target: str, source_column: str
) -> str:
    \"\"\"Defines the name of a foreign key constraint.

    For simplicity, we use the naming convention used by alembic here:
    https://alembic.sqlalchemy.org/en/latest/batch.html#dropping-unnamed-or-named-foreign-key-constraints.

    Args:
        source: Source table name.
        target: Target table name.
        source_column: Source column name.

    Returns:
        Name of the foreign key constraint.
    \"\"\"
    name = f"fk_{source}_{source_column}_{target}"
    if len(name) > 63:
        hashed = hashlib.md5(name.encode()).hexdigest()
        name = f"fk_{hashed}"
    return name"""

    fk_pattern = r'def foreign_key_constraint_name\([\s\S]+?return f"fk_\{source\}_\{source_column\}_\{target\}"'
    if 'hashed = hashlib.md5(name.encode()).hexdigest()' not in content:
        if re.search(fk_pattern, content):
            original_content = content
            content = re.sub(fk_pattern, new_fk_function, content)
            if content != original_content:
                print("Patched foreign_key_constraint_name")
            else:
                fail("Failed to patch foreign_key_constraint_name")
        else:
            fail("Could not find foreign_key_constraint_name function to patch")

    new_ix_function = """def get_index_name(table_name: str, column_names: List[str]) -> str:
    \"\"\"Get the name for an index.

    Args:
        table_name: The name of the table for which the index will be created.
        column_names: Names of the columns on which the index will be created.

    Returns:
        The index name.
    \"\"\"
    columns = "_".join(column_names)
    name = f"ix_{table_name}_{columns}"
    if len(name) > 63:
        hashed = hashlib.md5(name.encode()).hexdigest()
        name = f"ix_{hashed}"
    return name"""

    ix_pattern = r'def get_index_name\([\s\S]+?return f"ix_\{table_name\}_\{columns\}"\[:64\]'
    if 'name = f"ix_{hashed}"' not in content:
        if re.search(ix_pattern, content):
            original_content = content
            content = re.sub(ix_pattern, new_ix_function, content)
            if content != original_content:
                print("Patched get_index_name")
            else:
                fail("Failed to patch get_index_name")
        else:
            fail("Could not find get_index_name function to patch")

    with open(file_path, "w") as f:
        f.write(content)


def patch_server_models(base_path):
    file_path = os.path.join(base_path, "models", "v2", "misc", "server_models.py")

    if not os.path.exists(file_path):
        fail(f"File not found: {file_path}")
        return

    with open(file_path, "r") as f:
        content = f.read()

    if 'POSTGRES = "postgresql"' not in content:
        if 'MYSQL = "mysql"' not in content:
            fail("Could not locate MYSQL enum in server_models.py")
            return
        
        content = content.replace(
            'MYSQL = "mysql"',
            'MYSQL = "mysql"\n    POSTGRES = "postgresql"'
        )
        if 'POSTGRES = "postgresql"' in content:
            print("Patched ServerDatabaseType")
        else:
            fail("Failed to patch ServerDatabaseType")
            return

    with open(file_path, "w") as f:
        f.write(content)


if __name__ == "__main__":
    print("Starting ZenML patching...")

    import zenml

    target_path = os.path.dirname(zenml.__file__)
    print(f"Targeting ZenML at: {target_path}")

    patch_sql_zen_store(target_path)
    patch_schemas(target_path)
    patch_schema_utils(target_path)
    patch_server_models(target_path)

    if _errors:
        print("\n" + "="*80)
        print("BUILD FAILED - ERRORS DETECTED:")
        print("="*80)
        for error in _errors:
            print(f"  - {error}")
        print("="*80)
        sys.exit(1)

    print("Patching complete - SUCCESS")
    sys.exit(0)
