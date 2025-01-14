Package.describe({
    name: 'chatra:safe-update',
    version: '3.0.0',
    summary: 'Make Meteor’s collection.update safer',
    git: 'https://github.com/chatr/safe-update.git',
    documentation: 'README.md',
});

Package.onUse((api) => {
    api.versionsFrom(['1.0', '2.0', '3.0']);
    api.use(['ecmascript', 'mongo']);
    api.mainModule('safe-update.js');
    api.export('setSafeUpdateConfig', 'server');
});

Package.onTest((api) => {
    api.use('chatra:safe-update');
    api.use(['ecmascript', 'tinytest', 'test-helpers', 'mongo', 'tracker', 'insecure', 'autopublish']);
    api.mainModule('safe-update-tests.js');
});
