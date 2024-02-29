# Divblox

Installation: `$ npm i -D divblox`

Usage: `$ npx divblox -h`

The Divblox CLI that provides access to all of Divblox's features

## Divblox Init

`npx divblox -i` or `npx divblox --init`

Initializes your project with the necessary divblox folder and files. Also configures your chosen ORM. (Currently only prisma supported)

## Divblox Sync

`npx divblox -s` or `npx divblox --sync`

Synchronizes the provided data model with a given database server. 
If a valid dxApiKey is provided - will retrieve the project's core data model and synchronize that.
- Can provide a `accept-all` flag to accept all user prompts.
- Can provide a`skip-pull` flag to NOT pull latest data model from divblox.app (even if dxApiKey exists)

## Divblox Data Model

`npx divblox -dm` or `npx divblox --datamodel`

Used to sync local data model with cloud data model on divblox.app. Mandatory initial parameter required: `push|pull`.
Will pull/push to the core data model by default.
- Can provide an additional parameter to specify the GUID of any other data model.

E.g. `npx divblox -dm pull fe25bb237234ae5e3775b1395eccf561`

## Divblox Version

`npx divblox -v` or `npx divblox --version`

Returns the currently installed version of the Divblox CLI

## Divblox Help

`npx divblox -h` or `npx divblox --help`

Returns a brief overview of the commands and flags available.
