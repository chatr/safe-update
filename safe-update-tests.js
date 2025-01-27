import {Mongo} from 'meteor/mongo';
import {Meteor} from 'meteor/meteor';
import {Tinytest} from 'meteor/tinytest';
import {Tracker} from 'meteor/tracker';

const Test = new Mongo.Collection('Test');

// Determines if the code is running under Meteor 3 or higher.
function isMeteor3() {
    return Meteor.isFibersDisabled;
}

// Helper function to get the current count
function currentCount () {
    const doc = Test.findOne('counter');
    return doc ? doc.count : 0;
}
async function currentCountAsync () {
    const doc = await Test.findOneAsync('counter');
    return doc ? doc.count : 0;
}

// Function to update the counter
function updateCounter (options = {}) {
    let modifier = {};
    const count = currentCount();
    const setter = {count: options.inc ? 10 : count + 1};
    const updateOptions = {replace: options.replace};

    if (options.set) {
        modifier.$set = setter;
    } else if (options.inc) {
        modifier.$inc = setter;
    } else {
        // No modifier operator, attempting a full document replace
        modifier = setter;
    }

    if (Meteor.isServer) {
        return Test.update('counter', modifier, updateOptions);
    } else {
        // Client: Call method
        Meteor.call('updateCounter', options, () => {});
    }
}

async function updateCounterAsync (options = {}) {
    let modifier = {};
    const count = await currentCountAsync();
    const setter = {count: options.inc ? 10 : count + 1};
    const updateOptions = {replace: options.replace};

    if (options.set) {
        modifier.$set = setter;
    } else if (options.inc) {
        modifier.$inc = setter;
    } else {
        // No modifier operator, attempting a full document replace
        modifier = setter;
    }

    if (Meteor.isServer) {
        // Server: Direct database update
        return Test.updateAsync('counter', modifier, updateOptions);
    } else {
        // Client: Call method
        return Meteor.callAsync('updateCounterAsync', options);
    }
}

// Initialize the 'counter' document
if (Meteor.isServer) {
    if (isMeteor3()) {
        Meteor.startup(async () => {
            const doc = await Test.findOneAsync('counter');
            if (!doc) {
                await Test.insertAsync({_id: 'counter', count: 0, another: 'field'});
            } else {
                await Test.updateAsync('counter', {$set: {another: 'field'}});
            }
        });

        // Define a Meteor method for client calls
        Meteor.methods({
            async updateCounterAsync(options) {
                return updateCounterAsync(options);
            },
        });
    }
    else {
        Meteor.startup(() => {
            const doc = Test.findOne('counter');
            if (!doc) {
                Test.insert({_id: 'counter', count: 0, another: 'field'});
            } else {
                Test.update('counter', {$set: {another: 'field'}});
            }
        });

        // Define a Meteor method for client calls
        Meteor.methods({
            updateCounter(options) {
                return updateCounter(options);
            }
        });
    }
}

// Define the basic tests
function basicTests () {
    if (isMeteor3()) {
        Tinytest.addAsync('throws if modifier does not contain any $-operators', async function (test) {
            try {
                await updateCounterAsync();
                test.fail('Expected error not thrown');
            } catch (error) {
                test.instanceOf(error, Meteor.Error, 'Error should be an instance of Meteor.Error');
                test.equal(error.error, 500, 'Error code should be "safe-update:no-modifier"');
            }
        });

        Tinytest.addAsync('does not throw with replace: true', async function (test) {
            const result = await updateCounterAsync({replace: true});
            test.equal(result, 1, 'One document should be updated');
        });

        Tinytest.addAsync('update works normally if modifier contains $-operators', async function (test) {
            const count = await currentCountAsync();
            await updateCounterAsync({set: true});
            test.equal(
                await currentCountAsync(),
                count + 1,
                'Counter should increment by 1'
            );

            await updateCounterAsync({inc: true});
            test.equal(
                await currentCountAsync(),
                count + 11,
                'Counter should increment by 10'
            );
        });
    }
    else {
        Tinytest.add('throws if modifier doesn’t contain any $-operators', function (test) {
            test.throws(function () {
                updateCounter();
            });
        });

        Tinytest.add('doesn’t throws with replace:true', function (test) {
            test.equal(updateCounter({replace: true}), 1, 'one doc should be updated');
        });

        Tinytest.add('update works normally if modifier does contain some $-operators', function (test) {
            var count = currentCount();
            test.equal(updateCounter({set: true}), 1, 'one doc should be updated');
            test.equal(count + 1, currentCount(), '+1 to counter');
            test.equal(updateCounter({inc: true}), 1, 'one doc should be updated');
            test.equal((count + 1) + 10, currentCount(), '+10 to counter');
        });
    }
}

// Run tests on the server
if (Meteor.isServer) {
    basicTests();
}

// Run tests on the client
if (Meteor.isClient) {
    // Wait for the subscription to be ready
    Tracker.autorun(function (c) {
        if (typeof currentCount() !== 'undefined') {
            // Subscription is ready
            basicTests();
            c.stop();
        }
    });
}
