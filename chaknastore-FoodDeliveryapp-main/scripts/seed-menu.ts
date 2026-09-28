import menuJson from '../menu.json' with { type: 'json' };
import { supabase } from '../lib/supabase-service';
import { menuService } from '../lib/supabase-service';
if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || !process.env.EXPO_PUBLIC_SUPABASE_URL) {
    console.error('❌ .env missing Supabase keys. Add them first.');
    process.exit(1);
}

async function seedMenu() {
    console.log('Seeding menu from menu.json...');

    const items = menuJson.menu.flatMap((cat: any) =>
        cat.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            category: cat.category,
            type: item.type,
            price: item.price * 100, // paise
            portion: item.portion,
            ingredients: item.ingredients.join(', '),
            image: '',
            available: true,
        }))
    );

    try {
        await menuService.seedMenuFromJson(items);
        console.log(`✅ Seeded ${items.length} menu items successfully!`);

        const liveItems = await menuService.getAllMenuItems();
        console.log('Live menu items:', liveItems.length);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seedMenu();
