Package.describe({
    name: 'chatra:safe-update',
    version: '2.1.1',
    // Brief, one-line summary of the package.
    summary: 'Make Meteor’s collection.update safer',
    // URL to the Git repository containing the source code for this package.
    git: 'https://github.com/chatr/safe-update.git',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('1.0');
    api.use([
        'underscore',
        'mongo'
    ]);
    api.addFiles('safe-update.js');
});

Package.onTest(function (api) {
    api.use(['tinytest', 'test-helpers', 'meteor-base', 'mongo', 'tracker', 'insecure', 'autopublish']);
    api.use('chatra:safe-update');
    api.addFiles('safe-update-tests.js');
});
