# chatra:safe-update

[![Version](https://img.shields.io/badge/meteor-2.x%20|%203.x-brightgreen?logo=meteor&logoColor=white)](https://github.com/chatr/safe-update)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Make Meteor’s `collection.update`/`collection.updateAsync` safer by preventing unintended updates and enforcing best practices.

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
    - [Prevent Empty Selector Updates](#prevent-empty-selector-updates)
    - [Enforce Modifier Operators](#enforce-modifier-operators)
    - [Configuration](#configuration)
- [Examples](#examples)
- [Tests](#tests)
- [License](#license)

---

## Introduction

The `chatra:safe-update` package enhances the safety of MongoDB `update` operations in Meteor applications by:

- Preventing updates with empty selectors unless explicitly allowed.
- Ensuring that updates use modifier operators (e.g., `$set`, `$inc`) unless the `replace` option is specified.
- Providing configuration options to include or exclude specific collections.

---

## Installation

```shell
meteor add chatra:safe-update
```

---

## Compatibility

- **Meteor Version 3 and Above**: Fully compatible, using the new asynchronous Meteor collections’ methods.
- **Meteor Version 2**: Maintains compatibility with synchronous methods.

---

## Usage

### Prevent Empty Selector Updates

By default, the package throws an error if you attempt to perform an update with an empty selector:

```javascript
// Throws an error
MyCollection.update({}, { $set: { field: 'value' } });
```

To allow updates with an empty selector, pass `allowEmptySelector: true` in the options:

```javascript
// Allowed
MyCollection.update({}, { $set: { field: 'value' } }, { allowEmptySelector: true });
```

### Enforce Modifier Operators

The package ensures that you use modifier operators (e.g., `$set`, `$inc`) in your updates:

```javascript
// Throws an error
MyCollection.update({ _id: 'docId' }, { field: 'value' });
```

To replace a document entirely, pass `replace: true` in the options:

```javascript
// Allowed
MyCollection.update({ _id: 'docId' }, { field: 'value' }, { replace: true });
```

### Configuration

To configure the package behavior, use the `setSafeUpdateConfig` function provided by the package:

```javascript
import { setSafeUpdateConfig } from 'meteor/chatra:safe-update';

setSafeUpdateConfig({
  except: ['logs'], // Collections to exclude from safety checks
  only: ['users', 'posts'], // Only apply safety checks to these collections
});
```

- **`except`**: An array of collection names to exclude from the safety checks.
- **`only`**: An array of collection names to include in the safety checks (all others are excluded).

---

## Examples

```javascript
import { Mongo } from 'meteor/mongo';

const Messages = new Mongo.Collection('messages');

// Safe update with modifier
Messages.update({ _id: 'msgId' }, { $set: { text: 'Updated message' } });
await Messages.updateAsync({ _id: 'msgId' }, { $set: { text: 'Updated message' } });

// Unsafe update without modifier (throws error)
Messages.update({ _id: 'msgId' }, { text: 'Updated message' }); // Throws error
await Messages.updateAsync({ _id: 'msgId' }, { text: 'Updated message' }); // Throws error

// Replacing document with replace option
Messages.update({ _id: 'msgId' }, { text: 'Updated message' }, { replace: true });
await Messages.updateAsync({ _id: 'msgId' }, { text: 'Updated message' }, { replace: true });
```

---

## Tests

The package includes a comprehensive test suite. To run the tests:

```shell
meteor test-packages ./ --driver-package meteortesting:mocha
```

---

## License

This package is licensed under the MIT License.
