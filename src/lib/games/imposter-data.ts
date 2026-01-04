// Secret Word / Hints for Imposter game mode
// Each word has 10 possible hints, one is randomly selected

export const IMPOSTER_WORDS: { secret: string; hints: string[] }[] = [
    // === PLACES ===

    // Fast Food Restaurants
    { secret: "McDonald's", hints: ['Golden Arches', 'Fast Food', 'Burger Joint', 'Drive-Thru', 'Happy Meal Place', 'Ronald\'s Place', 'Big Mac Home', 'Fry Spot', 'Quarter Pounder', 'McFlurry'] },
    { secret: "Chick-fil-A", hints: ['Chicken Sandwich', 'Closed Sundays', 'Fast Food', 'Waffle Fries', 'My Pleasure', 'Chicken Chain', 'Nuggets', 'Lemonade Spot', 'Drive-Thru', 'Spicy Deluxe'] },
    { secret: "Taco Bell", hints: ['Mexican Fast Food', 'Crunch Wrap', 'Baja Blast', 'Fourth Meal', 'Taco Chain', 'Gordita', 'Chalupa', 'Live Mas', 'Cheesy Gordita', 'Nacho Fries'] },
    { secret: "Wendy's", hints: ['Square Patties', 'Frosty', 'Fast Food', 'Red Pigtails', 'Baconator', 'Burger Chain', 'Twitter Roasts', 'Spicy Chicken', 'Dave Thomas', 'Fresh Never Frozen'] },
    { secret: "Subway", hints: ['Sandwich Artist', 'Footlong', 'Fresh Veggies', 'Sub Shop', 'Bread Choices', 'Jared\'s Place', 'Toasted Sub', 'Eat Fresh', 'Italian BMT', 'Meatball Sub'] },
    { secret: "Starbucks", hints: ['Coffee Chain', 'Green Logo', 'Frappuccino', 'Mermaid', 'Latte Art', 'Pumpkin Spice', 'Venti Size', 'Barista', 'Pike Place', 'Caramel Macchiato'] },
    { secret: "Dunkin", hints: ['Donuts', 'Coffee Chain', 'Boston Creme', 'Munchkins', 'America Runs On', 'Pink Orange Logo', 'Iced Coffee', 'Coolatta', 'Wake Up', 'Drive-Thru Coffee'] },
    { secret: "Chipotle", hints: ['Burrito Bowl', 'Mexican Grill', 'Guacamole', 'Cilantro Lime', 'Carnitas', 'Sofritas', 'Assembly Line', 'Chipotle Pepper', 'Barbacoa', 'Burrito Chain'] },
    { secret: "Pizza Hut", hints: ['Pizza Chain', 'Pan Pizza', 'Stuffed Crust', 'Book It', 'Red Roof', 'Breadsticks', 'Personal Pan', 'Pizza Delivery', 'Wing Street', 'P\'Zone'] },
    { secret: "Domino's", hints: ['Pizza Delivery', 'Tracker', 'Dots Logo', 'Pan Pizza', 'Brooklyn Style', 'Lava Cakes', 'Philly Steak', 'Carryout Deal', 'Pizza Chain', 'Garlic Knots'] },
    { secret: "Popeyes", hints: ['Louisiana Chicken', 'Spicy Sandwich', 'Cajun Fries', 'Biscuits', 'Red Beans Rice', 'Fast Food Chicken', 'Butterfly Shrimp', 'Mardi Gras Bird', 'Cajun Style', 'Love That Chicken'] },
    { secret: "KFC", hints: ['Colonel Sanders', 'Fried Chicken', 'Bucket', 'Secret Recipe', 'Kentucky', 'Finger Lickin', 'Original Recipe', 'Extra Crispy', 'Mashed Potatoes', '11 Herbs'] },
    { secret: "Sonic", hints: ['Drive-In', 'Roller Skates', 'Slush', 'Tater Tots', 'Carhop', 'Happy Hour', 'Cherry Limeade', 'Ocean Water', 'Coney Dog', 'Footlong Coney'] },
    { secret: "Five Guys", hints: ['Burgers Fries', 'Peanuts', 'Red White Interior', 'Cajun Fries', 'Milkshakes', 'Fresh Beef', 'Foil Wrapper', 'Toppings Free', 'Little Burger', 'Bacon Cheeseburger'] },
    { secret: "In-N-Out", hints: ['Animal Style', 'Secret Menu', 'California Burgers', 'Palm Trees', 'Double Double', 'West Coast', 'Fresh Fries', 'Protein Style', 'Drive-Thru', 'Red Yellow Logo'] },

    // Theme Parks & Attractions
    { secret: "Disneyland", hints: ['Magic Kingdom', 'Sleeping Beauty Castle', 'California Park', 'Happiest Place', 'Mickey Mouse', 'Main Street USA', 'Fantasyland', 'Walt Disney', 'Fireworks', 'Space Mountain'] },
    { secret: "Disney World", hints: ['Florida Park', 'Magic Kingdom', 'Epcot', 'Animal Kingdom', 'Orlando', 'Cinderella Castle', 'Mickey Mouse', 'Monorail', 'Most Magical', 'Four Parks'] },
    { secret: "Universal Studios", hints: ['Harry Potter', 'Hollywood', 'Movie Park', 'Jurassic World', 'Minions', 'Studio Tour', 'Globe Logo', 'Theme Park', 'Transformers', 'Horror Nights'] },
    { secret: "Six Flags", hints: ['Roller Coasters', 'Theme Park', 'Thrill Rides', 'Looney Tunes', 'Season Pass', 'Mr. Six', 'Flags Logo', 'Amusement Park', 'Flash Pass', 'Fright Fest'] },
    { secret: "SeaWorld", hints: ['Orcas', 'Marine Park', 'Shamu', 'Aquarium', 'Dolphins', 'Sea Lions', 'Splash Zone', 'Ocean Theme', 'Roller Coasters', 'Florida Park'] },
    { secret: "Legoland", hints: ['Brick Theme', 'Building Blocks', 'Miniland', 'Kids Park', 'Denmark Origin', 'Colorful Bricks', 'Build Experience', 'Family Theme', 'Plastic Toys', 'California Florida'] },
    { secret: "Cedar Point", hints: ['Ohio Park', 'Roller Coaster Capital', 'Millennium Force', 'Lake Erie', 'Sandusky', 'Top Thrill', 'Steel Vengeance', 'Thrill Park', 'Gemini', 'Raptor'] },
    { secret: "Busch Gardens", hints: ['Virginia Florida', 'African Theme', 'Roller Coasters', 'SeaWorld Parks', 'Anheuser Busch', 'Williamsburg Tampa', 'Animal Exhibits', 'Thrill Rides', 'Gardens Theme', 'Howl-O-Scream'] },

    // Famous Landmarks
    { secret: "Eiffel Tower", hints: ['Paris', 'Iron Lady', 'France Landmark', 'Gustave Eiffel', 'Light Show', 'Champ de Mars', 'Romantic Spot', 'Steel Structure', 'Observation Deck', 'World Fair'] },
    { secret: "Statue of Liberty", hints: ['New York', 'Lady Liberty', 'Ellis Island', 'France Gift', 'Torch', 'Green Copper', 'Crown', 'Freedom Symbol', 'Harbor', 'Emma Lazarus'] },
    { secret: "Golden Gate Bridge", hints: ['San Francisco', 'Orange Red', 'Suspension Bridge', 'California', 'Bay Area', 'Fog', 'Art Deco', 'Pacific Ocean', 'Famous Bridge', 'International Orange'] },
    { secret: "Grand Canyon", hints: ['Arizona', 'National Park', 'Colorado River', 'Red Rocks', 'Mile Deep', 'Hiking', 'South Rim', 'Natural Wonder', 'Desert', 'Geological Wonder'] },
    { secret: "Mount Rushmore", hints: ['Presidents', 'South Dakota', 'Stone Faces', 'Lincoln', 'Washington', 'Jefferson', 'Roosevelt', 'Black Hills', 'Sculpture', 'National Memorial'] },
    { secret: "Niagara Falls", hints: ['Waterfall', 'New York Canada', 'Maid of Mist', 'Horseshoe Falls', 'Honeymoon Capital', 'Border Falls', 'Natural Wonder', 'Barrel Stunts', 'Powerful Falls', 'Ontario'] },
    { secret: "Hollywood Sign", hints: ['Los Angeles', 'Hills', 'White Letters', 'California', 'Movie Industry', 'Mount Lee', 'Landmark', 'Entertainment Capital', 'Sunset View', 'Hollywoodland'] },
    { secret: "Times Square", hints: ['New York City', 'New Years Eve', 'Ball Drop', 'Broadway', 'Bright Lights', 'Billboards', 'Manhattan', 'Crossroads', 'Tourist Spot', 'Neon Signs'] },
    { secret: "Las Vegas Strip", hints: ['Casinos', 'Nevada', 'Gambling', 'Neon Lights', 'Sin City', 'Hotels', 'Entertainment', 'Bellagio', 'Desert', 'Shows'] },
    { secret: "Empire State Building", hints: ['New York', 'Skyscraper', 'Art Deco', 'King Kong', 'Observatory', 'Manhattan', 'Tall Building', 'Lightning Rod', 'Fifth Avenue', 'Iconic Tower'] },
    { secret: "Big Ben", hints: ['London', 'Clock Tower', 'Westminster', 'Parliament', 'England', 'Chimes', 'Elizabeth Tower', 'British Symbol', 'Gothic', 'Thames'] },
    { secret: "Colosseum", hints: ['Rome', 'Gladiators', 'Ancient Arena', 'Italy', 'Roman Empire', 'Amphitheater', 'Ruins', 'Architecture', 'Historic Site', 'Flavian'] },
    { secret: "Great Wall of China", hints: ['Beijing', 'Ancient Structure', 'Dynasty', 'Long Wall', 'Chinese Landmark', 'Defense Wall', 'World Wonder', 'Hiking', 'Stone Structure', 'Ming Dynasty'] },
    { secret: "Taj Mahal", hints: ['India', 'Marble', 'Mausoleum', 'Shah Jahan', 'Agra', 'White Building', 'Love Symbol', 'Mogul', 'World Wonder', 'Symmetrical'] },
    { secret: "Sydney Opera House", hints: ['Australia', 'Sails', 'Harbor', 'Concert Hall', 'Performing Arts', 'Iconic Building', 'White Shells', 'Jorn Utzon', 'Sydney Harbor', 'Architecture'] },
    { secret: "Machu Picchu", hints: ['Peru', 'Inca', 'Lost City', 'Mountains', 'Ancient Ruins', 'Andes', 'Llamas', 'Sacred Valley', 'Incan Trail', 'Cusco'] },
    { secret: "Stonehenge", hints: ['England', 'Stone Circle', 'Ancient Monument', 'Salisbury', 'Druids', 'Mystery', 'Neolithic', 'Solstice', 'Prehistoric', 'Standing Stones'] },

    // Stores & Retail
    { secret: "Walmart", hints: ['Superstore', 'Blue Yellow', 'Rollback', 'Save Money', 'Sam Walton', 'Low Prices', 'Supercenter', 'Arkansas', 'Retail Giant', 'Great Value'] },
    { secret: "Target", hints: ['Bullseye', 'Red Store', 'Discount Retail', 'Up and Up', 'Car Park', 'Minneapolis', 'Shopping', 'Tar-zhay', 'Red Circles', 'Dog Mascot'] },
    { secret: "Costco", hints: ['Warehouse Club', 'Membership', 'Bulk Buying', 'Kirkland', 'Food Court', 'Hot Dog Deal', 'Samples', 'Wholesale', 'Pallet Shopping', 'Big Box'] },
    { secret: "IKEA", hints: ['Swedish Furniture', 'Assembly Required', 'Meatballs', 'Flat Pack', 'Blue Yellow', 'Showroom', 'Billy Bookcase', 'Scandinavian', 'Warehouse', 'Allen Key'] },
    { secret: "Amazon", hints: ['Online Shopping', 'Jeff Bezos', 'Prime', 'Delivery', 'Smile Logo', 'Echo Alexa', 'AWS', 'Seattle', 'Boxes', 'Two Day Shipping'] },
    { secret: "Apple Store", hints: ['iPhone', 'Genius Bar', 'Steve Jobs', 'Technology', 'Cupertino', 'MacBook', 'Glass Cube', 'AirPods', 'iPad', 'Retail Tech'] },
    { secret: "Best Buy", hints: ['Electronics Store', 'Blue Yellow', 'Geek Squad', 'TVs', 'Tech Retail', 'Appliances', 'Price Match', 'Gaming', 'Computers', 'Tag Logo'] },
    { secret: "Home Depot", hints: ['Orange Store', 'Hardware', 'DIY', 'Home Improvement', 'Power Tools', 'Lumber', 'Contractor', 'Orange Apron', 'Building Supplies', 'Workshop'] },

    // === THINGS ===

    // Animals
    { secret: "Elephant", hints: ['Safari Animal', 'Trunk', 'Big Ears', 'African Asian', 'Ivory Tusks', 'Gray Giant', 'Peanuts', 'Memory', 'Largest Land', 'Pachyderm'] },
    { secret: "Penguin", hints: ['Flightless Bird', 'Tuxedo', 'Antarctica', 'Waddle', 'Ice Bird', 'Colony', 'March of', 'Emperor', 'Fish Eater', 'Cold Weather'] },
    { secret: "Dolphin", hints: ['Ocean Mammal', 'Clicks', 'Smart Animal', 'Pod', 'Flipper', 'Echolocation', 'Gray Marine', 'Jumping', 'Aquarium', 'Bottlenose'] },
    { secret: "Giraffe", hints: ['Long Neck', 'Spots', 'Tall Animal', 'Africa', 'Safari', 'Tower', 'Leaves Eater', 'Savanna', 'Purple Tongue', 'Zoo Animal'] },
    { secret: "Lion", hints: ['King of Jungle', 'Mane', 'Pride', 'Roar', 'Savanna', 'Africa', 'Big Cat', 'Simba', 'Hunter', 'Apex Predator'] },
    { secret: "Tiger", hints: ['Stripes', 'Big Cat', 'Orange Black', 'Asia', 'Endangered', 'Bengal', 'Siberian', 'Jungle Cat', 'Roar', 'Tony the'] },
    { secret: "Panda", hints: ['Black White', 'Bamboo', 'China', 'Bear', 'Endangered', 'WWF Logo', 'Cute Bear', 'Zoo Star', 'Rolling', 'Lazy Animal'] },
    { secret: "Koala", hints: ['Australia', 'Eucalyptus', 'Bear Like', 'Sleepy', 'Pouch', 'Marsupial', 'Tree Climber', 'Cute Animal', 'Gray Fur', 'Outback'] },
    { secret: "Kangaroo", hints: ['Australia', 'Pouch', 'Hopping', 'Joey', 'Boxing', 'Marsupial', 'Outback', 'Tail Balance', 'Wallaby Cousin', 'Jumping'] },
    { secret: "Shark", hints: ['Ocean Predator', 'Fins', 'Jaws', 'Great White', 'Teeth', 'Cartilage', 'Week', 'Apex Predator', 'Fish', 'Scary Animal'] },
    { secret: "Octopus", hints: ['Eight Arms', 'Tentacles', 'Ink', 'Ocean', 'Intelligence', 'Camouflage', 'Suckers', 'Mollusk', 'Escape Artist', 'Cephalopod'] },
    { secret: "Owl", hints: ['Night Bird', 'Hooting', 'Wise', 'Rotating Head', 'Nocturnal', 'Silent Flight', 'Big Eyes', 'Prey Hunter', 'Who', 'Feathers'] },
    { secret: "Unicorn", hints: ['Mythical Horse', 'Horn', 'Rainbow', 'Magical', 'Fantasy', 'White Horse', 'Fairytale', 'Legend', 'Sparkles', 'Rare Creature'] },
    { secret: "Dragon", hints: ['Fire Breather', 'Wings', 'Mythical Beast', 'Scales', 'Fantasy', 'Medieval', 'Flying Reptile', 'Treasure Hoard', 'Knight Foe', 'Legendary'] },
    { secret: "Dinosaur", hints: ['Prehistoric', 'Extinct', 'T-Rex', 'Fossils', 'Jurassic', 'Giant Reptile', 'Ancient Animal', 'Meteor', 'Bones', 'Museum'] },
    { secret: "Butterfly", hints: ['Wings', 'Caterpillar', 'Metamorphosis', 'Colorful Insect', 'Chrysalis', 'Flowers', 'Flutter', 'Monarch', 'Delicate', 'Migration'] },
    { secret: "Flamingo", hints: ['Pink Bird', 'Long Legs', 'One Leg', 'Lawn Ornament', 'Flock', 'Shrimp Eater', 'Florida', 'Tropical', 'Wading Bird', 'Curved Beak'] },
    { secret: "Sloth", hints: ['Slow Animal', 'Tree Hanger', 'Lazy', 'Rainforest', 'Three Toed', 'Sleep All Day', 'Hanging', 'South America', 'Algae Fur', 'Cute Animal'] },
    { secret: "Peacock", hints: ['Feather Display', 'Blue Bird', 'Tail Fan', 'India', 'Colorful', 'Male Bird', 'Strutting', 'Eyes Pattern', 'Peahen', 'Proud Bird'] },
    { secret: "Wolf", hints: ['Pack Animal', 'Howling', 'Wild Dog', 'Alpha', 'Gray Wolf', 'Lone Wolf', 'Forest', 'Hunting', 'Werewolf Story', 'Fangs'] },

    // Video Game Characters & Objects
    { secret: "Mario", hints: ['Nintendo', 'Plumber', 'Red Hat', 'Mushroom Kingdom', 'Princess Peach', 'Bowser', 'Luigi Brother', 'Jumping', 'Coins', 'Super Star'] },
    { secret: "Pikachu", hints: ['Pokemon', 'Electric Type', 'Yellow Mouse', 'Ash Ketchum', 'Thunder Bolt', 'Pika Pika', 'Cheeks', 'Starter', 'Cute Monster', 'Japanese Game'] },
    { secret: "Minecraft", hints: ['Block Game', 'Creeper', 'Steve', 'Survival', 'Crafting', 'Diamonds', 'Mojang', 'Sandbox', 'Enderman', 'Building'] },
    { secret: "Fortnite", hints: ['Battle Royale', 'Building', 'V-Bucks', 'Flossing', 'Epic Games', '100 Players', 'Storm Circle', 'Skins', 'Drop In', 'Victory Royale'] },
    { secret: "Among Us", hints: ['Imposter Game', 'Sus', 'Crewmate', 'Emergency Meeting', 'Tasks', 'Vent', 'Spaceship', 'Social Deduction', 'Vote Out', 'Beans'] },
    { secret: "Pokemon", hints: ['Catch Em All', 'Pikachu', 'Nintendo', 'Pokeball', 'Trainers', 'Gym Badges', 'Japanese Game', 'Evolution', 'Trading Cards', 'Gotta Catch'] },
    { secret: "Zelda", hints: ['Link', 'Nintendo', 'Hyrule', 'Master Sword', 'Triforce', 'Princess', 'Ganondorf', 'Adventure', 'Ocarina', 'Green Tunic'] },
    { secret: "Sonic", hints: ['Blue Hedgehog', 'Speed', 'Sega', 'Rings', 'Tails', 'Dr Eggman', 'Green Hill', 'Chili Dogs', 'Fast Runner', 'Spin Dash'] },
    { secret: "Roblox", hints: ['Online Platform', 'Robux', 'User Games', 'Blocky Avatar', 'Kids Gaming', 'Oof Sound', 'Adopt Me', 'Building', 'Multiplayer', 'Free Play'] },
    { secret: "Game Boy", hints: ['Nintendo Handheld', 'Portable Gaming', 'Green Screen', 'Tetris', 'AA Batteries', 'Brick Game', 'Pokemon Red Blue', 'Retro', 'Link Cable', 'Gray Device'] },
    { secret: "PlayStation", hints: ['Sony Console', 'DualShock', 'Gaming System', 'Triangle Square', 'PS5', 'Blue Logo', 'Japanese Console', 'Controller', 'Trophy', 'PlayStation Plus'] },
    { secret: "Xbox", hints: ['Microsoft Console', 'Green Logo', 'Halo', 'Game Pass', 'Controller', 'Master Chief', 'Live Gold', 'Gaming System', 'Series X', 'American Console'] },
    { secret: "Nintendo Switch", hints: ['Hybrid Console', 'Joy Cons', 'Portable Dock', 'Mario', 'Zelda', 'Click Sound', 'Handheld TV', 'Japanese Console', 'Red Blue', 'Tablet Gaming'] },

    // Food & Drinks
    { secret: "Pizza", hints: ['Italian Food', 'Cheese Pepperoni', 'Delivery', 'Slices', 'Crust', 'Toppings', 'Round Food', 'Oven Baked', 'Party Food', 'Pie'] },
    { secret: "Hamburger", hints: ['Beef Patty', 'Buns', 'Fast Food', 'American Food', 'Grill', 'Ketchup Mustard', 'Cheese Option', 'BBQ', 'Ground Beef', 'Cookout'] },
    { secret: "Ice Cream", hints: ['Frozen Dessert', 'Cone', 'Scoop', 'Vanilla Chocolate', 'Summer Treat', 'Sprinkles', 'Brain Freeze', 'Sundae', 'Cold Sweet', 'Dairy'] },
    { secret: "Sushi", hints: ['Japanese Food', 'Raw Fish', 'Rice Roll', 'Seaweed', 'Wasabi', 'Chopsticks', 'Sake Pair', 'Sashimi', 'California Roll', 'Soy Sauce'] },
    { secret: "Taco", hints: ['Mexican Food', 'Shell', 'Beef Filling', 'Salsa', 'Tuesday', 'Crunchy Soft', 'Guacamole', 'Lettuce Cheese', 'Hand Food', 'Tex Mex'] },
    { secret: "Hot Dog", hints: ['Ballpark Food', 'Bun', 'Mustard Ketchup', 'Frankfurter', 'Oscar Mayer', 'Grilled', 'Street Food', 'Relish', 'American Classic', 'Wiener'] },
    { secret: "Donut", hints: ['Round Sweet', 'Hole Center', 'Glazed', 'Sprinkles', 'Coffee Pair', 'Fried Dough', 'Police Joke', 'Dunkin', 'Krispy Kreme', 'Breakfast Sweet'] },
    { secret: "Popcorn", hints: ['Movie Snack', 'Kernels', 'Butter Salt', 'Popping Sound', 'Carnival', 'Microwave', 'Theater Food', 'Crunch', 'Yellow White', 'Corn Snack'] },
    { secret: "Coffee", hints: ['Morning Drink', 'Caffeine', 'Starbucks', 'Beans', 'Espresso', 'Wake Up', 'Barista', 'Hot Beverage', 'Latte', 'Black Brown'] },
    { secret: "Chocolate", hints: ['Sweet Treat', 'Cocoa', 'Candy', 'Brown Sweet', 'Hershey', 'Valentine', 'Milk Dark', 'Easter Bunny', 'Swiss', 'Melting'] },
    { secret: "Bubble Tea", hints: ['Tapioca Pearls', 'Boba', 'Taiwan Drink', 'Chewy Drink', 'Milk Tea', 'Sweet Beverage', 'Asian Drink', 'Straw', 'Cold Drink', 'Trendy Beverage'] },
    { secret: "Avocado", hints: ['Green Fruit', 'Guacamole', 'Toast Topping', 'California', 'Healthy Fat', 'Pit Seed', 'Millennial', 'Creamy Fruit', 'Mexican Food', 'Hass'] },
    { secret: "Bacon", hints: ['Breakfast Meat', 'Crispy', 'Pork', 'Sizzling', 'Smoky', 'Strips', 'Everything Better', 'BLT', 'Fatty', 'Sunday Morning'] },
    { secret: "Pancakes", hints: ['Breakfast Stack', 'Syrup', 'Flapjacks', 'Butter Top', 'Sunday Breakfast', 'IHOP', 'Griddle', 'Fluffy', 'Blueberry', 'Batter'] },
    { secret: "Watermelon", hints: ['Summer Fruit', 'Green Rind', 'Red Inside', 'Seeds', 'Juicy', 'Picnic Fruit', 'Melon', 'Refreshing', 'Seedless', 'BBQ Side'] },
    { secret: "Candy Corn", hints: ['Halloween Candy', 'Orange Yellow White', 'Triangle Shape', 'Controversial', 'Fall Treat', 'Waxy', 'October', 'Love or Hate', 'Harvest', 'Corn Shape'] },
    { secret: "Gummy Bears", hints: ['Chewy Candy', 'Haribo', 'Fruit Flavors', 'Bear Shape', 'German Candy', 'Gelatin', 'Colorful', 'Kids Candy', 'Movie Snack', 'Sugar Coated'] },

    // Everyday Objects
    { secret: "Smartphone", hints: ['Mobile Device', 'iPhone Android', 'Touchscreen', 'Apps', 'Pocket Computer', 'Texting', 'Camera', 'Internet', 'Battery Life', 'Always Connected'] },
    { secret: "Headphones", hints: ['Audio Device', 'Ear Cups', 'Music Listening', 'AirPods', 'Wireless', 'DJ Gear', 'Noise Canceling', 'Over Ear', 'Bass', 'Private Listening'] },
    { secret: "Sunglasses", hints: ['Eye Protection', 'Summer Accessory', 'Shades', 'UV Protection', 'Cool Look', 'Ray Ban', 'Beach Wear', 'Tinted Lenses', 'Fashion', 'Bright Light'] },
    { secret: "Backpack", hints: ['School Bag', 'Shoulder Straps', 'Hiking Gear', 'Books Carrier', 'Zipper', 'Student Essential', 'Travel Bag', 'Jansport', 'Back Carrier', 'Storage'] },
    { secret: "Umbrella", hints: ['Rain Protection', 'Folding', 'Canopy', 'Handle', 'Storm Gear', 'Mary Poppins', 'Wet Weather', 'Open Close', 'Parasol', 'Shelter'] },
    { secret: "Bicycle", hints: ['Two Wheels', 'Pedaling', 'Handlebars', 'Cycling', 'Exercise', 'Chain Gears', 'Helmet Needed', 'Eco Transport', 'Bell', 'Balance'] },
    { secret: "Skateboard", hints: ['Four Wheels', 'Deck', 'Tricks', 'Tony Hawk', 'Ollie', 'Halfpipe', 'Street Sport', 'Kickflip', 'Bearings', 'Trucks'] },
    { secret: "Microwave", hints: ['Kitchen Appliance', 'Reheat', 'Popcorn Button', 'Rotating Plate', 'Quick Heat', 'Beeping', 'Radiation', 'Leftovers', 'Convenience', 'Timer'] },
    { secret: "Television", hints: ['Living Room', 'Screen', 'Remote Control', 'Channels', 'Streaming', 'Flat Screen', 'Entertainment', 'Couch Potato', 'Smart TV', 'Watching'] },
    { secret: "Refrigerator", hints: ['Cold Storage', 'Kitchen Appliance', 'Food Preservation', 'Freezer', 'Ice Maker', 'Chilled', 'Leftovers', 'Magnets Door', 'Humming', 'Fresh Food'] },
    { secret: "Toilet", hints: ['Bathroom Fixture', 'Porcelain Throne', 'Flushing', 'Seat', 'Plumbing', 'Restroom', 'Bowl', 'Paper Roll', 'Privacy', 'Necessity'] },
    { secret: "Toothbrush", hints: ['Dental Care', 'Bristles', 'Morning Routine', 'Electric', 'Oral Hygiene', 'Paste Partner', 'Bathroom', 'Twice Daily', 'Handle', 'Clean Teeth'] },
    { secret: "Alarm Clock", hints: ['Wake Up', 'Morning Sound', 'Snooze Button', 'Ringing', 'Bedside', 'Time Display', 'Sleep Enemy', 'Digital Analog', 'Early Morning', 'Buzzing'] },
    { secret: "Sneakers", hints: ['Athletic Shoes', 'Nike Adidas', 'Running', 'Laces', 'Comfortable', 'Rubber Sole', 'Streetwear', 'Jordans', 'Sneakerhead', 'Sports Shoes'] },
    { secret: "Wallet", hints: ['Money Holder', 'Pocket Accessory', 'Cards Cash', 'Leather', 'Billfold', 'ID Cards', 'Lost Found', 'Slim Fat', 'Bifold', 'Essentials'] },
    { secret: "Laptop", hints: ['Portable Computer', 'MacBook', 'Work Device', 'Keyboard Screen', 'Battery Power', 'Work From Home', 'Student Essential', 'Folding Computer', 'Dell HP', 'Typing'] },
    { secret: "Pillow", hints: ['Sleep Accessory', 'Head Rest', 'Soft Fluffy', 'Bed Item', 'Down Feather', 'Pillow Fight', 'Cushion', 'Memory Foam', 'Comfort', 'Dreams'] },
    { secret: "Candle", hints: ['Wax Light', 'Flame', 'Wick', 'Scented', 'Relaxation', 'Birthday Cake', 'Romantic', 'Melting', 'Yankee', 'Ambiance'] },
    { secret: "Mirror", hints: ['Reflection', 'Glass Surface', 'Vanity', 'Bathroom', 'Self View', 'Break Bad Luck', 'Dressing', 'Look Check', 'Silvered', 'Image'] },
    { secret: "Clock", hints: ['Time Telling', 'Hands Face', 'Ticking', 'Wall Mounted', 'Hours Minutes', 'Twelve Numbers', 'Grandfather', 'Timepiece', 'Punctuality', 'Analog Digital'] },
    { secret: "Calendar", hints: ['Dates Months', 'Wall Hanging', 'Planning', 'Days Week', 'Appointments', 'Year View', 'Scheduling', 'Holidays Marked', 'Countdown', 'Organization'] },

    // Transportation
    { secret: "Airplane", hints: ['Flying Machine', 'Wings', 'Airport', 'Pilot', 'Travel', 'Boeing Airbus', 'Turbulence', 'First Class', 'Takeoff Landing', 'Sky Travel'] },
    { secret: "Helicopter", hints: ['Rotor Blades', 'Hovering', 'Chopper', 'Vertical Flight', 'Rescue', 'Landing Pad', 'Aviation', 'Military Civilian', 'Spinning', 'Aerial'] },
    { secret: "Submarine", hints: ['Underwater Vessel', 'Navy', 'Periscope', 'Yellow Beatles', 'Deep Sea', 'Torpedo', 'U-Boat', 'Diving', 'Ocean Depths', 'Pressure'] },
    { secret: "Train", hints: ['Railroad', 'Locomotive', 'Tracks', 'Choo Choo', 'Passenger', 'Freight', 'Station', 'Conductor', 'Steam Engine', 'Railway'] },
    { secret: "School Bus", hints: ['Yellow Vehicle', 'Students', 'Morning Ride', 'Stop Sign', 'Driver', 'Route', 'Educational Transport', 'Flashing Lights', 'Seats', 'Back of Bus'] },
    { secret: "Fire Truck", hints: ['Red Vehicle', 'Sirens', 'Ladder', 'Firefighters', 'Emergency', 'Hose', 'Station', 'Rescue', 'Dalmatian', 'Hero Vehicle'] },
    { secret: "Monster Truck", hints: ['Giant Wheels', 'Crushing Cars', 'Grave Digger', 'Stunts', 'Loud Engine', 'Arena', 'Jumping', 'Extreme', 'Muddy', 'Competition'] },
    { secret: "Hot Air Balloon", hints: ['Basket Flight', 'Rising Heat', 'Colorful', 'Floating', 'Scenic', 'Festival', 'Burner', 'Sky Ride', 'Peaceful', 'Anniversary'] },

    // Sports & Recreation
    { secret: "Basketball", hints: ['Orange Ball', 'Hoop Net', 'NBA', 'Dribbling', 'Court', 'Three Pointer', 'Slam Dunk', 'Michael Jordan', 'Shooting', 'Team Sport'] },
    { secret: "Football", hints: ['Pigskin', 'Touchdown', 'NFL', 'Quarterback', 'Super Bowl', 'Field Goal', 'Helmet', 'Tackle', 'End Zone', 'Sunday'] },
    { secret: "Soccer Ball", hints: ['World Cup', 'Goal', 'FIFA', 'Kicking', 'Field Sport', 'Futbol', 'Penalty Kick', 'Goalie', 'Black White', 'Most Popular Sport'] },
    { secret: "Tennis Racket", hints: ['Court Sport', 'Strings', 'Serving', 'Wimbledon', 'Love Score', 'Ace', 'Yellow Ball', 'Net', 'Grand Slam', 'Williams Federer'] },
    { secret: "Golf Club", hints: ['Swinging', 'Green Course', 'Hole in One', 'Caddy', 'PGA', 'Tiger Woods', 'Tee', 'Fairway', 'Putting', 'Country Club'] },
    { secret: "Baseball Bat", hints: ['Home Run', 'Wooden Aluminum', 'MLB', 'Swing', 'Pitcher', 'Diamond', 'Strikeout', 'Batter Up', 'Dugout', 'Grand Slam'] },
    { secret: "Hockey Puck", hints: ['Rubber Disk', 'Ice Rink', 'NHL', 'Slap Shot', 'Goal', 'Zamboni', 'Stanley Cup', 'Stick', 'Frozen', 'Canadian Sport'] },
    { secret: "Surfboard", hints: ['Wave Riding', 'Beach Sport', 'California Hawaii', 'Wax', 'Fins', 'Hang Ten', 'Ocean', 'Pipeline', 'Balance', 'Surf Culture'] },
    { secret: "Bowling Ball", hints: ['Finger Holes', 'Pins', 'Lane', 'Strike Spare', 'Alley', 'Shoes Rental', 'Gutter', 'Heavy Ball', 'Ten Pin', 'Frame'] },
    { secret: "Yoga Mat", hints: ['Exercise', 'Stretching', 'Meditation', 'Rubber Foam', 'Fitness', 'Poses', 'Rolled Up', 'Namaste', 'Flexibility', 'Wellness'] },

    // Entertainment & Music
    { secret: "Guitar", hints: ['Six Strings', 'Frets', 'Strumming', 'Acoustic Electric', 'Rock Music', 'Chords', 'Pick', 'Fender Gibson', 'Band Instrument', 'Solo'] },
    { secret: "Piano", hints: ['Keyboard Instrument', 'Black White Keys', 'Classical', 'Grand Upright', 'Beethoven Mozart', 'Pedals', 'Ivory', 'Concert Hall', '88 Keys', 'Pianist'] },
    { secret: "Drums", hints: ['Percussion', 'Sticks', 'Beat Rhythm', 'Cymbals', 'Rock Band', 'Kick Snare', 'Drumline', 'Fill', 'Loud Instrument', 'Kit'] },
    { secret: "Microphone", hints: ['Singing', 'Amplification', 'Karaoke', 'Wireless', 'Recording', 'Stage', 'Podcast', 'Cordless', 'Voice', 'Speaking'] },
    { secret: "Movie Theater", hints: ['Big Screen', 'Popcorn', 'Cinema', 'Reclining Seats', 'Previews', 'Dark Room', 'Blockbuster', 'Concessions', 'Surround Sound', 'Date Night'] },
    { secret: "Concert", hints: ['Live Music', 'Stadium Arena', 'Tickets', 'Opening Act', 'Encore', 'Fan Experience', 'Mosh Pit', 'Light Show', 'Merchandise', 'Tour'] },
    { secret: "Roller Coaster", hints: ['Theme Park', 'Thrill Ride', 'Loops', 'Screaming', 'Adrenaline', 'Fast Drop', 'Tracks', 'Queue Line', 'Stomach Drop', 'Fun Fear'] },
    { secret: "Ferris Wheel", hints: ['Fair Ride', 'Circular', 'Sky View', 'Gondola', 'Romantic', 'Slow Ride', 'Carnival', 'Chicago Invented', 'Night Lights', 'Observation'] },
    { secret: "Carousel", hints: ['Merry Go Round', 'Horses', 'Music Box', 'Spinning', 'Children Ride', 'Fair', 'Poles', 'Up Down', 'Classic Ride', 'Painted Animals'] },

    // Seasons & Weather
    { secret: "Snowman", hints: ['Winter', 'Carrot Nose', 'Coal Eyes', 'Three Balls', 'Frosty', 'Scarf Hat', 'Melting', 'Snow Sculpture', 'Stick Arms', 'Holiday Decor'] },
    { secret: "Rainbow", hints: ['After Rain', 'Seven Colors', 'Pot of Gold', 'Arc Sky', 'Prism', 'Colorful', 'Leprechaun', 'Weather Phenomenon', 'Spectrum', 'Hope Symbol'] },
    { secret: "Tornado", hints: ['Funnel Cloud', 'Twister', 'Storm', 'Destructive', 'Midwest', 'Wizard of Oz', 'Spinning Wind', 'Warning Siren', 'Dorothy', 'Natural Disaster'] },
    { secret: "Lightning", hints: ['Electric Strike', 'Thunder', 'Storm', 'Flash', 'Zeus', 'Bolt Shape', 'Dangerous', 'Sky Light', 'Power Outage', 'Seconds Count'] },
    { secret: "Volcano", hints: ['Erupting', 'Lava', 'Magma', 'Mountain', 'Hawaii', 'Ash Cloud', 'Ring of Fire', 'Dormant Active', 'Crater', 'Pompeii'] },
    { secret: "Earthquake", hints: ['Ground Shaking', 'Fault Line', 'Richter Scale', 'Tremor', 'California', 'Disaster', 'Plates Moving', 'Aftershock', 'Seismic', 'Building Damage'] },
    { secret: "Sunset", hints: ['Evening', 'Orange Pink', 'Horizon', 'Golden Hour', 'Romantic', 'Beach View', 'Photography', 'End of Day', 'Beautiful', 'West'] },
    { secret: "Northern Lights", hints: ['Aurora Borealis', 'Sky Colors', 'Alaska', 'Green Purple', 'Night Sky', 'Iceland', 'Solar Wind', 'Dancing Lights', 'Bucket List', 'Arctic'] },

    // Holidays & Celebrations
    { secret: "Christmas Tree", hints: ['December', 'Ornaments', 'Star Top', 'Pine Fir', 'Presents Under', 'Lights', 'Tinsel', 'Evergreen', 'Living Room', 'Tradition'] },
    { secret: "Jack-o-Lantern", hints: ['Halloween', 'Carved Pumpkin', 'Candle Inside', 'October', 'Scary Face', 'Front Porch', 'Glowing', 'Seeds', 'Trick Treat', 'Fall Decor'] },
    { secret: "Easter Egg", hints: ['Spring Holiday', 'Decorated', 'Hunt', 'Bunny', 'Pastel Colors', 'Hidden', 'Basket', 'Chocolate Plastic', 'Dyed', 'Rolling'] },
    { secret: "Birthday Cake", hints: ['Candles', 'Celebration', 'Wish', 'Frosting', 'Party', 'Singing', 'Age Number', 'Slice', 'Happy Birthday', 'Sweet Treat'] },
    { secret: "Fireworks", hints: ['Explosions', 'Fourth of July', 'New Year', 'Colorful Sky', 'Loud Booms', 'Celebration', 'Sparkles', 'Night Show', 'Ooh Aah', 'Finale'] },
    { secret: "Piñata", hints: ['Mexican Tradition', 'Candy Inside', 'Blindfolded', 'Stick Hitting', 'Party', 'Paper Mache', 'Colorful', 'Birthday', 'Breaking', 'Treats Spill'] },
    { secret: "Wedding Ring", hints: ['Marriage', 'Proposal', 'Diamond', 'Finger', 'Engagement', 'Gold Silver', 'Forever', 'Ceremony', 'Band', 'I Do'] },
    { secret: "Champagne", hints: ['Celebration Drink', 'Bubbles', 'Toast', 'Cork Pop', 'New Year', 'Wedding', 'French', 'Sparkling Wine', 'Flute Glass', 'Cheers'] },

    // School & Office
    { secret: "Pencil", hints: ['Writing Tool', 'Yellow', 'Eraser End', 'Number 2', 'Lead Graphite', 'Sharpener', 'Wooden', 'School Supply', 'Test Taking', 'Drawing'] },
    { secret: "Scissors", hints: ['Cutting Tool', 'Two Blades', 'Handles', 'Paper Cutting', 'Safety Tip', 'Craft Supply', 'Hair Cutting', 'Left Right', 'Snipping', 'Sharp'] },
    { secret: "Globe", hints: ['Earth Model', 'Spinning', 'Geography', 'Countries', 'Desk Item', 'World Map', 'Classroom', 'Spherical', 'Continents', 'Learning Tool'] },
    { secret: "Backpack", hints: ['School Bag', 'Books Carrier', 'Straps', 'Student', 'Zipper', 'Homework', 'Supplies', 'Heavy Load', 'Lunch Bag', 'Locker'] },
    { secret: "Stapler", hints: ['Office Tool', 'Paper Binding', 'Metal Clips', 'Desk Item', 'Click Sound', 'Swingline', 'Office Space', 'Refills', 'Red', 'Staples'] },
    { secret: "Whiteboard", hints: ['Dry Erase', 'Markers', 'Office Meeting', 'Classroom', 'Brainstorming', 'Erasable', 'Wall Mounted', 'Teaching', 'White Surface', 'Presentation'] },

    // Nature
    { secret: "Sunflower", hints: ['Yellow Petals', 'Tall Plant', 'Sun Following', 'Seeds', 'Summer Flower', 'Van Gogh', 'Kansas', 'Garden', 'Bright', 'Oil Seeds'] },
    { secret: "Cactus", hints: ['Desert Plant', 'Spines', 'Water Storage', 'Succulent', 'Arizona', 'Prickly', 'Green', 'Saguaro', 'Drought', 'Houseplant'] },
    { secret: "Palm Tree", hints: ['Tropical', 'Coconuts', 'Beach', 'California Florida', 'Fronds', 'Paradise', 'Tall Trunk', 'Vacation', 'Shade', 'Island'] },
    { secret: "Mushroom", hints: ['Fungi', 'Cap Stem', 'Forest Floor', 'Poisonous Edible', 'Fairy Ring', 'Spores', 'Pizza Topping', 'Mario', 'Toadstool', 'Decomposer'] },
    { secret: "Waterfall", hints: ['Falling Water', 'Nature', 'Cliff', 'Rainbow Mist', 'Niagara', 'Hiking', 'Loud Roar', 'Scenic', 'Pool Below', 'Cascade'] },
    { secret: "Coral Reef", hints: ['Ocean', 'Colorful', 'Marine Life', 'Great Barrier', 'Ecosystem', 'Snorkeling', 'Fish', 'Diving', 'Underwater', 'Endangered'] },
    { secret: "Bamboo", hints: ['Panda Food', 'Fast Growing', 'Asia', 'Wood Grass', 'Sustainable', 'Furniture', 'Green Stalks', 'Strong', 'Hollow', 'Zen Garden'] },
    { secret: "Seashell", hints: ['Beach', 'Ocean', 'Sand', 'Collecting', 'Spiral', 'Sound of Sea', 'Decoration', 'Mollusk', 'Souvenirs', 'Conch'] },

    // Toys & Games
    { secret: "Lego", hints: ['Building Blocks', 'Plastic Bricks', 'Danish Toy', 'Stepping Pain', 'Creative', 'Sets', 'Minifigures', 'Colorful', 'Instructions', 'Snap Together'] },
    { secret: "Rubik's Cube", hints: ['Puzzle', 'Six Colors', 'Twisting', 'Brain Teaser', 'Speed Solving', 'Frustrating', '1980s', 'Hungarian', 'Algorithm', 'Cube'] },
    { secret: "Teddy Bear", hints: ['Stuffed Animal', 'Cuddly', 'Childrens Toy', 'Soft', 'Brown Furry', 'Bedtime', 'Roosevelt', 'Hugging', 'Build a Bear', 'Plush'] },
    { secret: "Yo-Yo", hints: ['String Toy', 'Up Down', 'Tricks', 'Walk Dog', 'Spinning', 'Retro Toy', 'Sleep', 'Round', 'Philippines', 'Hand Skill'] },
    { secret: "Frisbee", hints: ['Flying Disc', 'Throwing', 'Beach Park', 'Plastic', 'Dog Catch', 'Ultimate', 'Outdoor', 'Aerodynamic', 'Wham-O', 'Spin'] },
    { secret: "Trampoline", hints: ['Bouncing', 'Backyard', 'Springs', 'Jumping', 'Safety Net', 'Kids', 'Exercise', 'Flips', 'Rebounding', 'Fun'] },
    { secret: "Monopoly", hints: ['Board Game', 'Real Estate', 'Passing Go', 'Jail', 'Hotels Houses', 'Dice', 'Money', 'Bankrupt', 'Long Game', 'Atlantic City'] },
    { secret: "Playing Cards", hints: ['Deck', '52 Cards', 'Suits', 'Poker', 'Shuffling', 'Dealing', 'Joker', 'Hearts Spades', 'Casino', 'Card Games'] },

    // Fashion & Accessories
    { secret: "High Heels", hints: ['Womens Shoes', 'Elevated', 'Stiletto', 'Red Carpet', 'Dress Up', 'Painful', 'Fashion', 'Pumps', 'Louboutin', 'Clicking Sound'] },
    { secret: "Necktie", hints: ['Professional', 'Mens Fashion', 'Knot', 'Formal Wear', 'Silk', 'Business', 'Suit Accessory', 'Windsor', 'Choking', 'Father Day Gift'] },
    { secret: "Baseball Cap", hints: ['Sports Hat', 'Brim', 'Curved Bill', 'Team Logo', 'Adjustable', 'Snapback', 'Backwards', 'Sun Protection', 'Casual', 'Bad Hair Day'] },
    { secret: "Cowboy Hat", hints: ['Western', 'Texas', 'Ranch', 'Wide Brim', 'Country', 'Rodeo', 'Stetson', 'Yeehaw', 'Wild West', 'Horse Riding'] },
    { secret: "Bow Tie", hints: ['Formal', 'Neck Accessory', 'Tuxedo', 'James Bond', 'Doctor Who', 'Clip On', 'Butterfly Shape', 'Fancy', 'Wedding', 'Nerdy Chic'] },
    { secret: "Flip Flops", hints: ['Summer Shoes', 'Beach', 'Thong Sandal', 'Casual', 'Pool', 'Slapping Sound', 'Easy On Off', 'Vacation', 'Rubber', 'Tan Lines'] },
    { secret: "Cowboy Boots", hints: ['Western', 'Pointed Toe', 'Texas', 'Country Music', 'Leather', 'Heel', 'Ranch', 'Rodeo', 'Line Dancing', 'Nashville'] },

    // Space & Science
    { secret: "Rocket Ship", hints: ['Space Travel', 'Launch', 'NASA SpaceX', 'Astronaut', 'Blast Off', 'Countdown', 'Fuel', 'Moon Mars', 'Thrust', 'Space Race'] },
    { secret: "Telescope", hints: ['Star Gazing', 'Lens', 'Astronomy', 'Observatory', 'Magnification', 'Night Sky', 'Planets', 'Galileo', 'Space Viewing', 'Tripod'] },
    { secret: "Robot", hints: ['Machine', 'AI', 'Beep Boop', 'Mechanical', 'Automation', 'Metal', 'Future', 'Programming', 'Terminator', 'Helper'] },
    { secret: "Dinosaur Fossil", hints: ['Prehistoric', 'Museum', 'Bones', 'Archaeology', 'T-Rex', 'Excavation', 'Ancient', 'Skeleton', 'Discovery', 'Extinct'] },
    { secret: "Meteor", hints: ['Space Rock', 'Shooting Star', 'Crater', 'Fireball', 'Asteroid', 'Night Sky', 'Burning Entry', 'Wish Upon', 'Cosmic', 'Impact'] },
    { secret: "Black Hole", hints: ['Space', 'Gravity', 'Event Horizon', 'Light Trap', 'Mysterious', 'Cosmic', 'Interstellar', 'Singularity', 'Hawking', 'Dense'] },
    { secret: "Moon", hints: ['Night Sky', 'Lunar', 'Phases', 'Tide Cause', 'Apollo', 'Crater', 'Full Moon', 'Werewolf', 'Orbit', 'One Small Step'] },
    { secret: "Planet Earth", hints: ['Home', 'Blue Marble', 'Third Rock', 'Continents', 'Oceans', 'Atmosphere', 'Life', 'Solar System', 'Globe', 'Pale Blue Dot'] },
];

// Helper to get a random word with a random hint
export function getRandomWordPair(usedIndices: number[]): { pair: { secret: string; hint: string }; index: number } {
    const availableIndices = IMPOSTER_WORDS.map((_, i) => i).filter(i => !usedIndices.includes(i));

    // If all words have been used, reset (allow repeats)
    const indices = availableIndices.length > 0 ? availableIndices : IMPOSTER_WORDS.map((_, i) => i);

    const randomIndex = indices[Math.floor(Math.random() * indices.length)];
    const word = IMPOSTER_WORDS[randomIndex];

    // Pick a random hint from the 10 available
    const randomHint = word.hints[Math.floor(Math.random() * word.hints.length)];

    return {
        pair: { secret: word.secret, hint: randomHint },
        index: randomIndex
    };
}
