/**
 * Gender-aware avatar helper.
 * Uses first-name heuristics to pick male or female profile photos.
 */

const MALE_AVATARS = [
    '/avatars/male1.jpg', '/avatars/male2.jpg', '/avatars/male3.jpg', '/avatars/male4.jpg',
    '/avatars/male5.jpg', '/avatars/male6.jpg', '/avatars/male7.jpg', '/avatars/male8.jpg',
];
const FEMALE_AVATARS = [
    '/avatars/female1.jpg', '/avatars/female2.jpg', '/avatars/female3.jpg', '/avatars/female4.jpg',
    '/avatars/female5.jpg', '/avatars/female6.jpg', '/avatars/female7.jpg',
];

// Common Indian female first names (lowercase) — extend as needed
const FEMALE_NAMES = new Set([
    'priya', 'sneha', 'meera', 'divya', 'kavya', 'ananya', 'nithya', 'pooja',
    'lakshmi', 'deepa', 'revathi', 'swathi', 'aishwarya', 'neha', 'riya',
    'shalini', 'pallavi', 'shreya', 'aditi', 'anu', 'bhavya', 'chaitra',
    'devi', 'gayathri', 'indira', 'janani', 'keerthana', 'lavanya', 'madhu',
    'nandini', 'padma', 'radha', 'saranya', 'tanvi', 'uma', 'vidya',
    'yamuna', 'zara', 'anjali', 'aparna', 'archana', 'ashwini', 'chitra',
    'deepika', 'geetha', 'harini', 'isha', 'jyoti', 'kalyani', 'latha',
    'meena', 'mythili', 'padmini', 'ramya', 'sandhya', 'sowmya', 'swapna',
    'thara', 'vasanthi', 'vidhya',
]);

/**
 * Pick an avatar path based on first name and a numeric seed (index, charCode, etc.)
 * @param {string} firstName
 * @param {number} seed — used to vary within the gender pool
 * @returns {string} avatar path
 */
export function getAvatar(firstName, seed = 0) {
    const isFemale = FEMALE_NAMES.has((firstName || '').toLowerCase().trim());
    const pool = isFemale ? FEMALE_AVATARS : MALE_AVATARS;
    return pool[Math.abs(seed) % pool.length];
}
