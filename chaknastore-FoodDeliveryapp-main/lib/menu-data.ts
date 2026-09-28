export const menuCatalog = [
  {
    category: "Tiffins",
    items: [
      { id: "TIF001", name: "Veg Thali", type: "veg", price: 239, portion: "full", description: "dal, chole/rajma, soya sabzi, dry sabzi, chapati, pulao" },
      { id: "TIF002", name: "Premium Veg Thali", type: "veg", price: 349, portion: "full", description: "paneer, dal, sabzi, chapati, pulao, gulab jamun" },
      { id: "TIF003", name: "Premium Chicken Thali", type: "non-veg", price: 379, portion: "full", description: "chicken gravy, dry chicken, rassa, chapati, rice, dessert" }
    ]
  },
  {
    category: "Chakna",
    items: [
      { id: "CHK001", name: "Chana Chakna Masala", type: "veg", price: 269, portion: "400g", description: "black chana, spices, herbs" },
      { id: "CHK002", name: "Chole Chakna Masala", type: "veg", price: 269, portion: "400g", description: "white chana, spices" },
      { id: "CHK003", name: "Fried Peanuts & Garlic", type: "veg", price: 189, portion: "150g", description: "peanuts, garlic, chilli, curry leaves" },
      { id: "CHK004", name: "Boiled Peanut Chaat", type: "veg", price: 189, portion: "200g", description: "boiled peanuts, chutney, salad" }
    ]
  },
  {
    category: "Veg Starters",
    items: [
      { id: "VS001", name: "Soya Chaap", type: "veg", price: 269, portion: "8 pcs", description: "soya, tandoori spices" },
      { id: "VS002", name: "Soya Chaap Banjara", type: "veg", price: 289, portion: "8 pcs", description: "soya, creamy marinade" },
      { id: "VS003", name: "Paneer Tikka", type: "veg", price: 349, portion: "8 pcs", description: "paneer, spices" }
    ]
  },
  {
    category: "Non-Veg Starters",
    items: [
      { id: "NVS001", name: "Chicken Tikka", type: "non-veg", price: 379, portion: "8 pcs", description: "chicken, tandoori spices" },
      { id: "NVS002", name: "Chicken Seekh Kebab", type: "non-veg", price: 289, portion: "4 pcs", description: "minced chicken, spices" },
      { id: "NVS006", name: "Chicken Lollipop", type: "non-veg", price: 489, portion: "8 pcs", description: "chicken wings, spices" }
    ]
  },
  {
    category: "Biryani",
    items: [
      { id: "BR001", name: "Veg Biryani", type: "veg", price: 529, portion: "1kg", description: "rice, vegetables, spices" },
      { id: "BR004", name: "Chicken Biryani", type: "non-veg", price: 689, portion: "1kg", description: "chicken, rice, spices" }
    ]
  }
];

export const menuItems = menuCatalog.flatMap(cat => cat.items.map(item => ({
    ...item,
    category: cat.category,
    available: true
})));

export function getMenuItems() {
    return menuItems;
}
