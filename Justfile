set dotenv-load

# List available commands
[private]
default:
  just help

# List available commands
help:
  just --justfile {{justfile()}} --list

# Chart module from https://github.com/hotosm/justfiles
chart *args:
    @curl -sS https://raw.githubusercontent.com/hotosm/justfiles/main/chart.just \
      -o {{justfile_directory()}}/tasks/chart.just;
    @just --justfile {{justfile_directory()}}/tasks/chart.just --set chart_name "fair" {{args}}

# Echo to terminal with blue colour
[no-cd]
_echo-blue text:
  #!/usr/bin/env sh
  printf "\033[0;34m%s\033[0m\n" "{{ text }}"

# Echo to terminal with yellow colour
[no-cd]
_echo-yellow text:
  #!/usr/bin/env sh
  printf "\033[0;33m%s\033[0m\n" "{{ text }}"

# Echo to terminal with red colour
[no-cd]
_echo-red text:
  #!/usr/bin/env sh
  printf "\033[0;41m%s\033[0m\n" "{{ text }}"
