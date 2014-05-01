exports.deepDelete = function deepDelete(obj, prop) {
    if (typeof obj === 'object') {
        delete obj[prop];
        Object.keys(obj).forEach(function(key) {
            deepDelete(obj[key], prop);
        });
    };
};
