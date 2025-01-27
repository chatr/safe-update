import {Mongo} from 'meteor/mongo';
import {Meteor} from 'meteor/meteor';

/**
 * Determines if the code is running under Meteor 3 or higher.
 * @return {boolean} True if Meteor 3 or higher.
 */
function isMeteor3() {
    return Meteor.isFibersDisabled;
}

/**
 * Module-level variable to store the configuration.
 * @type {Object}
 */
let safeUpdateConfig = {};

/**
 * Sets the configuration for the safe-update package.
 * @param {Object} config The configuration object.
 */
export function setSafeUpdateConfig(config) {
    safeUpdateConfig = config || {};
}

/**
 * Performs the safety checks before an update operation.
 * @param {Object} collection The Mongo collection.
 * @param {Object} selector The selector for the update.
 * @param {Object} modifier The modifier for the update.
 * @param {Object} options The options for the update.
 */
function performSafetyChecks(collection, selector, modifier, options) {
    const allowEmptySelector = options.allowEmptySelector || options.upsert;
    if (!allowEmptySelector && Object.keys(selector).length === 0) {
        throw new Meteor.Error(
            500,
            'Selector is empty. To use an empty selector, pass {allowEmptySelector: true} in the update options.'
        );
    }

    const config = safeUpdateConfig;
    const collectionName = collection._name;
    let okToUpdate =
        !modifier ||
        options.replace ||
        (config.except && config.except.includes(collectionName)) ||
        (config.only && !config.only.includes(collectionName));

    if (!okToUpdate) {
        okToUpdate = Object.keys(modifier).some((operator) => /^\$/.test(operator));
    }

    if (!okToUpdate) {
        throw new Meteor.Error(
            500,
            'Modifier does not contain any $-operators. To replace the document, pass {replace: true} in the update options.'
        );
    }
}

const CollectionPrototype = Mongo.Collection.prototype;

if (isMeteor3()) {
    // Meteor 3: Override updateAsync method
    const originalUpdateAsync = CollectionPrototype.updateAsync;

    CollectionPrototype.updateAsync = async function (selector, modifier, options = {}) {
        performSafetyChecks(this, selector, modifier, options);
        return await originalUpdateAsync.call(this, selector, modifier, options);
    };
} else {
    // Meteor 2: Override update method
    const originalUpdate = CollectionPrototype.update;

    CollectionPrototype.update = function (selector, modifier, options = {}, callback) {
        // Adjust arguments if options or callback are omitted
        if (typeof options === 'function') {
            callback = options;
            options = {};
        } else if (!options) {
            options = {};
        }

        try {
            performSafetyChecks(this, selector, modifier, options);
        } catch (error) {
            if (callback) {
                return callback(error);
            }
            throw error;
        }

        return originalUpdate.call(this, selector, modifier, options, callback);
    };
}
