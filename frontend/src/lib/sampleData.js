export const sampleResorts = [
  {
    _id: "sample-kali",
    name: "Kali River Edge Resort",
    slug: "kali-river-edge-resort",
    location: "Kogilban, Dandeli",
    shortDescription: "Riverside stay with rafting access, meals, bonfire space, and family rooms.",
    description:
      "A calm river-facing resort for families, student groups, and corporate weekend plans. Pinoxx coordinates availability, best-price guidance, activity slots, sightseeing support, food preferences, and local guidance from inquiry to check-out.",
    resortType: "premium",
    startingPrice: 1799,
    sharingPrice: 1799,
    couplePrice: 3499,
    rating: 4.8,
    distanceFromBusStandKm: 3.2,
    distanceToWaterActivitiesKm: 1.4,
    amenities: ["River view", "Meals", "Parking", "Bonfire", "Swimming pool", "Power backup", "Guide support"],
    activities: ["River rafting", "Kayaking", "Zipline", "Jungle safari", "Campfire"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
        alt: "Kali river side resort view"
      },
      {
        url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80",
        alt: "Resort swimming pool"
      },
      {
        url: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=80",
        alt: "Premium room"
      }
    ],
    rooms: [
      {
        name: "River View Cottage",
        price: 2499,
        capacity: 3,
        description: "Private cottage with river-facing sit-out and attached washroom.",
        images: [
          {
            url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
            alt: "River view cottage"
          }
        ]
      },
      {
        name: "Family Deluxe Room",
        price: 1999,
        capacity: 4,
        description: "Comfortable AC room suited for families and mixed groups.",
        images: [
          {
            url: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
            alt: "Family deluxe room"
          }
        ]
      }
    ]
  },
  {
    _id: "sample-hornbill",
    name: "Hornbill Jungle Retreat",
    slug: "hornbill-jungle-retreat",
    location: "Ganeshgudi, Dandeli",
    shortDescription: "Forest retreat with nature trails, birding, adventure activities, and group packages.",
    description:
      "A nature-first Dandeli resort for guests who want a quieter stay near forest routes while still having access to rafting and adventure activities through Pinoxx coordination.",
    resortType: "bamboo",
    startingPrice: 1499,
    sharingPrice: 1499,
    couplePrice: 2999,
    rating: 4.6,
    distanceFromBusStandKm: 8.5,
    distanceToWaterActivitiesKm: 2.8,
    amenities: ["Forest view", "Meals", "Indoor games", "Campfire", "Nature trail", "Doctor on call"],
    activities: ["Bird watching", "Nature walk", "River rafting", "Cycling", "Boating"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80",
        alt: "Forest retreat"
      },
      {
        url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=80",
        alt: "Jungle cottage"
      }
    ],
    rooms: [
      {
        name: "Jungle Cottage",
        price: 1899,
        capacity: 3,
        description: "Independent forest cottage with meal package options.",
        images: [
          {
            url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
            alt: "Jungle cottage room"
          }
        ]
      }
    ]
  },
  {
    _id: "sample-adventure",
    name: "Adventure Nest Dandeli",
    slug: "adventure-nest-dandeli",
    location: "Old Dandeli Road",
    shortDescription: "Activity-focused resort for groups seeking rafting, zipline, kayaking, and pool time.",
    description:
      "A practical resort for high-energy groups who want easy activity planning. Pinoxx helps confirm slots, prices, inclusions, sightseeing options, and travel guidance from arrival to check-out.",
    resortType: "budget",
    startingPrice: 1299,
    sharingPrice: 1299,
    couplePrice: 2499,
    rating: 4.4,
    distanceFromBusStandKm: 5.1,
    distanceToWaterActivitiesKm: 0.9,
    amenities: ["Swimming pool", "Meals", "DJ on request", "Parking", "Activity desk", "First-aid support"],
    activities: ["River rafting", "Zipline", "Kayaking", "Zorbing", "Rain dance"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80",
        alt: "Pool resort in Dandeli"
      },
      {
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
        alt: "River adventure"
      }
    ],
    rooms: [
      {
        name: "Adventure Room",
        price: 1599,
        capacity: 4,
        description: "Simple, clean room for groups with package meal options.",
        images: [
          {
            url: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
            alt: "Adventure room"
          }
        ]
      }
    ]
  }
];

export const sampleReviews = [
  {
    _id: "sample-review-1",
    rating: 5,
    comment: "Pinoxx kept the resort, rafting, and food plan clear before we reached Dandeli.",
    user: { name: "Aarav" },
    images: [
      {
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
        alt: "Guest river view"
      }
    ]
  }
];
