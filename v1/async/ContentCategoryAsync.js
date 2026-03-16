import ContentCategory from "../models/ContentCategory.js";

async function syncContentCategories(contentId, categoryIds = []) {
    const cleanIds = (categoryIds || []).filter(Boolean);

    // 1) voeg ontbrekende koppels toe (upsert)
    const bulk = cleanIds.map((catId) => ({
        updateOne: {
            filter: {content_id: contentId, category_id: catId},
            update: {$setOnInsert: {content_id: contentId, category_id: catId}},
            upsert: true
        }
    }));

    if (bulk.length > 0) {
        await ContentCategory.bulkWrite(bulk, {ordered: false});
    }

    // 2) verwijder koppels die niet meer in de lijst zitten
    await ContentCategory.deleteMany({
        content_id: contentId,
        category_id: {$nin: cleanIds}
    });
}

export default syncContentCategories