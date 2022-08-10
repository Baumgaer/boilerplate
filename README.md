# Boilerplate

This boilerplate aims to provide a fullstack single page webapp with mobile application and service worker.

## Usage of

### Most important production dependencies

- VUE 3
    - vue-class-component
    - vue-property-decorator
- ionic
    - capacitor
- ExpressJS (and most of popular middlewares like helmet or express-session)
- lodash
- i18next
- typeorm
    - sql.js
    - localforage
- zod

### most important development dependencies

- typescript
    - ttypescript
- webpack
- babel
- mocha
    - chai
- cypress
- nyc
- eslint
- stylelint
- commitlint
- husky
- lintstaged

## Features

- minimal configuration required for linters, tests, builds, compatibility tools,
- automatic api- and database-schema generation with decorators
- code sharing for front-, back- and mobile-end (one codebase)
- api mapping of frontend and backend with DDD (no CRUD)
- possibility of fire-and-forget backend with CQRS and event sourcing
- possibility of classic backend api

## Dependencies

- Web
    - Node.js version 14 or higher
- Android
    - JAVA 11
    - Android Studio version 2020.1 or higher
    - An Android SDK installation with api version 22 or higher
- iOS
    - Xcode version 13 or higher
    - Xcode Command Line Tools
    - Homebrew
    - Cocoapods version 1.11.3 or higher
- Hardware
    - A Smartphone with usb debugging enabled

## Dependency configuration

- Install node js full fledged (with node-gyp and everything node js provides in its installation)
- follow this guide https://capacitorjs.com/docs/getting-started/environment-setup
    - make sure you use JAVA in your Android Studio. NOT KOTLIN! Otherwise Java will be missing.
        - Install JAVA 11 if missing

## Installation

- `git clone https://github.com/Eluminati/boilerplate.git name-of-your-project`
- `cd name-of-your-project`
- `npm install`
- `npm run build`

## Usage of scripts

- Development
    - Server development
        - `npm run dev:server` (currently not available)
    - Web frontend development
        - `npm run dev:web`
    - App development
        - `npm run dev:app` (manually choose platform)
            - `npm run dev:app:android`
            - `npm run dev:app:ios`
    - Everything at the same time except app
        - `npm run dev`
- Build
    - Server build
        - `npm run build:server` (currently not available)
    - Web frontend build
        - `npm run build:web`
    - App build
        - `npm run build:app` (manually choose platform)
            - `npm run build:app:android`
            - `npm run build:app:ios`
    - Everything at the same time except app
        - `npm run build`
- Test
    - Unit-Tests
        - `npm run test:unit`
    - E2E-Tests
        - `npm run test:e2e`
    - Everything sequentially
        - `npm run test`

## Conventions

- Scripts are linted by eslint with rules defined in the `.eslintrc`
- Styles are linted by stylelint with rules defined in the `.stylelintrc`
- Commit messages are linted by commitlint with rules defined in the `.commitlintrc`
    - The format is: `type(scope?): message #issue`
    - `type` can be:
        - `build` for updating build configuration, development tools or other changes irrelevant to the user
        - `chore` for changes which are not relevant to the build, production or documentation like typos in comments for example
        - `ci` for changes in the CI/CD chain
        - `docs` for changes to the documentation
        - `feat` for a new feature for the user, not a new feature for build script. Such commit will trigger a release bumping a MINOR version
        - `fix` for a bug fix for the user, not a fix to a build script. Such commit will trigger a release bumping a PATCH version
        - `perf` for performance improvements. Such commit will trigger a release bumping a PATCH version
        - `refactor` for refactoring production code, e.g. renaming a variable
        - `revert` for commits which revert changes
        - `style` for formatting changes, missing semicolons, etc
        - `test` for adding missing tests, refactoring tests; no production code change
