import {Mongo} from 'meteor/mongo';
import {Meteor} from 'meteor/meteor';
import {Tinytest} from 'meteor/tinytest';
import {Tracker} from 'meteor/tracker';

const Test = new Mongo.Collection('Test');

// Helper function to get the current count
let currentCount;
if (Meteor.isFibersDisabled) {
    // Meteor 3
    currentCount = async () => {
        const doc = await Test.findOneAsync('counter');
        return doc ? doc.count : 0;
    };
} else {
    // Meteor 2
    currentCount = () => {
        const doc = Test.findOne('counter');
        return doc ? doc.count : 0;
    };
}

// Function to update the counter
const updateCounter = async (options = {}) => {
    let modifier = {};
    const count = (Meteor.isFibersDisabled
        ? await currentCount()
        : currentCount());
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
        if (Meteor.isFibersDisabled) {
            // Meteor 3
            return await Test.updateAsync('counter', modifier, updateOptions);
        } else {
            // Meteor 2
            return Test.update('counter', modifier, updateOptions);
        }
    } else {
        // Client: Call method
        return new Promise((resolve, reject) => {
            Meteor.call('updateCounter', options, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }
};

// Initialize the 'counter' document
if (Meteor.isServer) {
    Meteor.startup(async () => {
        const doc = await (Meteor.isFibersDisabled
            ? Test.findOneAsync('counter')
            : Test.findOne('counter'));

        if (!doc) {
            if (Meteor.isFibersDisabled) {
                // Meteor 3
                await Test.insertAsync({_id: 'counter', count: 0, another: 'field'});
            } else {
                // Meteor 2
                Test.insert({_id: 'counter', count: 0, another: 'field'});
            }
        } else {
            if (Meteor.isFibersDisabled) {
                // Meteor 3
                await Test.updateAsync('counter', {$set: {another: 'field'}});
            } else {
                // Meteor 2
                Test.update('counter', {$set: {another: 'field'}});
            }
        }
    });

    // Define a Meteor method for client calls
    Meteor.methods({
        async updateCounter(options) {
            return await updateCounter(options);
        },
    });
}

// Define the basic tests
const basicTests = () => {
    Tinytest.addAsync('throws if modifier does not contain any $-operators', async function (test, onComplete) {
        try {
            await updateCounter();
            test.fail('Expected error not thrown');
        } catch (error) {
            test.instanceOf(error, Meteor.Error, 'Error should be an instance of Meteor.Error');
            test.equal(error.error, 500, 'Error code should be "safe-update:no-modifier"');
            onComplete();
        }
    });

    Tinytest.addAsync('does not throw with replace: true', async function (test, onComplete) {
        const result = await updateCounter({replace: true});
        test.equal(result, 1, 'One document should be updated');
        onComplete();
    });

    Tinytest.addAsync('update works normally if modifier contains $-operators', async function (test, onComplete) {
        const count = (Meteor.isFibersDisabled
            ? await currentCount()
            : currentCount());
        await updateCounter({set: true});
        test.equal(
            (Meteor.isFibersDisabled ? await currentCount() : currentCount()),
            count + 1,
            'Counter should increment by 1'
        );

        await updateCounter({inc: true});
        test.equal(
            (Meteor.isFibersDisabled ? await currentCount() : currentCount()),
            count + 11,
            'Counter should increment by 10'
        );
        onComplete();
    });
};

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
