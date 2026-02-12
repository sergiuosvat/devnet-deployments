"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFeed = validateFeed;
function validateFeed(items) {
    const errors = [];
    if (!Array.isArray(items)) {
        return { valid: false, errors: ["Feed root must be an array of items"] };
    }
    items.forEach((item, index) => {
        if (!item.id)
            errors.push(`Item ${index}: Missing 'id'`);
        if (!item.title)
            errors.push(`Item ${index}: Missing 'title'`);
        if (!item.description)
            errors.push(`Item ${index}: Missing 'description'`);
        if (!item.link)
            errors.push(`Item ${index}: Missing 'link'`);
        if (!item.image_link)
            errors.push(`Item ${index}: Missing 'image_link'`);
        if (!item.availability)
            errors.push(`Item ${index}: Missing 'availability'`);
        if (!item.price) {
            errors.push(`Item ${index}: Missing 'price' object`);
        }
        else {
            if (!item.price.value)
                errors.push(`Item ${index}: Missing 'price.value'`);
            if (!item.price.currency)
                errors.push(`Item ${index}: Missing 'price.currency'`);
        }
    });
    return {
        valid: errors.length === 0,
        errors
    };
}
