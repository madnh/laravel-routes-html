# Laravel Routes to HTML

Convert Laravel exported routes to HTML page

**Install**
> npm i -g laravel-routes-html

**Command**
> laravel-routes-html


```
laravel-routes-html/1.0.0

Usage:
  $ laravel-routes-html <routes>

Commands:
  <routes>  Routes file (JSON)

For more info, run any command with the `--help` flag:
  $ laravel-routes-html --help

Options:
  -O, --output <output>  Output file (default: routes.html)
  --title <title>        Title (default: Routes)
  -h, --help             Display this message 
  -v, --version          Display version number 

```

## Usage:

### 1 - Export current routes

At Laravel code, run:

```shell
php artisan route:list --json > routes.json
```

### 2 - Process routes

At this code, run:

```shell
laravel-routes-html routes.json
```