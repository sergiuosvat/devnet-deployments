export interface FeedItem {
    id: string;
    title: string;
    description: string;
    link: string;
    image_link: string;
    availability: string;
    price: {
        value: string;
        currency: string;
    };
    brand?: string;
    condition?: string;
}

export function validateFeed(items: unknown[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(items)) {
        return { valid: false, errors: ["Feed root must be an array of items"] };
    }

    (items as any[]).forEach((item, index) => {
        if (!item.id) errors.push(`Item ${index}: Missing 'id'`);
        if (!item.title) errors.push(`Item ${index}: Missing 'title'`);
        if (!item.description) errors.push(`Item ${index}: Missing 'description'`);
        if (!item.link) errors.push(`Item ${index}: Missing 'link'`);
        if (!item.image_link) errors.push(`Item ${index}: Missing 'image_link'`);
        if (!item.availability) errors.push(`Item ${index}: Missing 'availability'`);

        if (!item.price) {
            errors.push(`Item ${index}: Missing 'price' object`);
        } else {
            if (!item.price.value) errors.push(`Item ${index}: Missing 'price.value'`);
            if (!item.price.currency) errors.push(`Item ${index}: Missing 'price.currency'`);
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
}
