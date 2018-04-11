# intercept-volt
Intercept + Volt Data Lab interface for joint dataviz projects

Most graphics were made using the [Flourish](https://flourish.studio/) D3 wrap.

## To run on localhost

This project contains all the dependencies it needs for its visualizations to work seamlessly without outside resources, such as CNDs or APIs.

All the data are bind to the folders in question.

For local development, we recommend using Nodejs' [HTTP-SERVER plugin](https://github.com/indexzero/http-server), so you can have a live environment with little effort.

We recommend disabling browser caching with `-c-1`, so it is not a hassle to change CSS elements. This is the command:

`http-server -c-1`
