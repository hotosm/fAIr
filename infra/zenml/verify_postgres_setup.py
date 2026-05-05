import sys

from sqlalchemy.schema import CreateTable
from sqlmodel import create_engine
from zenml.zen_stores.schemas.step_run_schemas import StepRunSchema
from zenml.zen_stores.sql_zen_store import SQLDatabaseDriver, SqlZenStoreConfiguration


def verify_enum():
    print("Verifying SQLDatabaseDriver enum...")
    if "postgresql" in SQLDatabaseDriver.values():
        print("SUCCESS: 'postgresql' found in SQLDatabaseDriver values.")
    else:
        print("FAILURE: 'postgresql' NOT found in SQLDatabaseDriver values.")
        sys.exit(1)

    if hasattr(SQLDatabaseDriver, "POSTGRES"):
        print("SUCCESS: SQLDatabaseDriver.POSTGRES attribute exists.")
        print(f"Value: {SQLDatabaseDriver.POSTGRES}")
    else:
        print("FAILURE: SQLDatabaseDriver.POSTGRES attribute missing.")
        sys.exit(1)


def verify_validation():
    print("\nVerifying URL validation...")
    config = SqlZenStoreConfiguration(
        url="postgresql://user:pass@postgres:5432/mydb", secrets_store={"type": "sql"}
    )
    # Check if credentials were extracted
    print(f"Config username: {config.username}")
    if not config.username or config.username.get_secret_value() != "user":
        print("FAILURE: Username not extracted from URL.")
        sys.exit(1)

    if not config.password or config.password.get_secret_value() != "pass":
        print("FAILURE: Password not extracted from URL.")
        sys.exit(1)

    if config.database != "mydb":
        print(f"FAILURE: Database not extracted from URL (got {config.database}).")
        sys.exit(1)

    # If this doesn't raise ValueError, validation passed basically
    # (or at least didn't fail on driver)
    driver = config.driver
    print(f"Config driver: {driver}")
    if driver == "postgresql":
        print("SUCCESS: Config driver is 'postgresql'.")
    else:
        print(f"FAILURE: Config driver is {driver}, expected 'postgresql'.")
        sys.exit(1)

    # Check sqlalchemy config generation
    try:
        url, connect_args, engine_args = config.get_sqlalchemy_config()
        print(f"Generated URL: {url}")
        if url.drivername == "postgresql+psycopg":
            print("SUCCESS: SQLAlchemy URL drivername is 'postgresql+psycopg'.")
        else:
            print(f"FAILURE: SQLAlchemy URL drivername is {url.drivername}.")
            sys.exit(1)
    except Exception as e:
        print(f"FAILURE: get_sqlalchemy_config raised exception: {e}")
        sys.exit(1)


def verify_schema():
    print("\nVerifying StepRunSchema variants...")
    # Ideally we inspect the column types.
    # exception_info column

    # We can compile the CREATE TABLE statement for postgres dialect
    engine = create_engine("postgresql+psycopg:///:memory:")
    table_sql = CreateTable(StepRunSchema.__table__).compile(engine)
    sql_str = str(table_sql)

    print("Checking DDL for exception_info column in StepRunSchema (Postgres)...")
    if "exception_info TEXT" in sql_str or 'exception_info" TEXT' in sql_str:
        print("SUCCESS: exception_info column is TEXT in Postgres DDL.")
    else:
        print("FAILURE: exception_info column is NOT TEXT in Postgres DDL. DDL:")
        print(sql_str)
        sys.exit(1)

    print("\nVerifying ApiTransactionResultSchema DDL (Postgres)...")
    from zenml.zen_stores.schemas.api_transaction_schemas import ApiTransactionResultSchema

    table_sql_result = CreateTable(ApiTransactionResultSchema.__table__).compile(engine)
    sql_str_result = str(table_sql_result)
    for mysql_type in ("MEDIUMTEXT", "MEDIUMBLOB"):
        if mysql_type in sql_str_result:
            print(f"FAILURE: ApiTransactionResultSchema DDL contains MySQL-specific type {mysql_type}. DDL:")
            print(sql_str_result)
            sys.exit(1)
    if "result" not in sql_str_result:
        print("FAILURE: result column missing from ApiTransactionResultSchema DDL. DDL:")
        print(sql_str_result)
        sys.exit(1)
    print("SUCCESS: ApiTransactionResultSchema DDL is Postgres-compatible.")

    print("\nVerifying Identifier Lengths...")
    from zenml.zen_stores.schemas.schema_utils import (
        foreign_key_constraint_name,
        get_index_name,
    )

    # Test Index Name
    # Create a long index name input
    long_table = "some_very_long_table_name_that_takes_up_space"
    long_cols = [
        "some_column_that_is_also_very_long",
        "another_column_that_is_long",
        "and_a_third_one",
    ]
    idx_name = get_index_name(long_table, long_cols)
    print(f"Generated Index Name: {idx_name} (len={len(idx_name)})")

    if len(idx_name) > 63:
        print(f"FAILURE: Index name exceeds 63 characters. Length: {len(idx_name)}")
        sys.exit(1)
    if "ix_" not in idx_name:
        print("FAILURE: Index name missing 'ix_' prefix.")
        sys.exit(1)

    # Test FK Name
    # Create a long FK name input
    fk_name = foreign_key_constraint_name(
        long_table, "target_table_is_also_long", "source_col_is_long"
    )
    print(f"Generated FK Name: {fk_name} (len={len(fk_name)})")

    if len(fk_name) > 63:
        print(f"FAILURE: FK name exceeds 63 characters. Length: {len(fk_name)}")
        sys.exit(1)
    if "fk_" not in fk_name:
        print("FAILURE: FK name missing 'fk_' prefix.")
        sys.exit(1)

    print("SUCCESS: Identifier length limits enforced.")


if __name__ == "__main__":
    verify_enum()
    verify_validation()
    verify_schema()
    print("\nALL VERIFICATIONS PASSED")
