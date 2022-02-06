# Sanity API

> Update document's fields using the sanity query/mutate api

Before to run the script you must create the .env file, that file needs to be created in order to set the environments variable that the script will use to connect to the sanity api.

Copy and paste the next text in your .env file, replace the <...> by giving the original value for each constant.

```
PROJECT_ID=<PROJECT_ID>
API_VERSION=<API_VERSION>
DATASET=<DATASET>
SANITY_API=<SANITY_API>
SANITY_EDIT_TOKEN=<SANITY_EDIT_TOKEN>
```

### Install node_modules

This a required step before to run the script, so, go to the terminal, then navigate to the directory project, and then, run this command:

```
$ npm isntall
```

Once you have set the values for the environments variables and installed the node_modules, you can now start the script by runing this command in the terminal:

```
$ npm start
```

You can find the results in the logs directory

> ./logs
