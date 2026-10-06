// Demo catalogue: each exam belongs to one teacher (by `teacher` key in teachers.js).
// correctAnswer is the 0-based index of the right option.
export const exams = [
    {
        teacher: 'omar',
        title: 'JavaScript Fundamentals',
        description: 'Variables, types, functions and scope in modern JavaScript (ES2015+).',
        duration: 20,
        passingScore: 60,
        questions: [
            { text: 'What does `typeof null` return?', options: ['"null"', '"object"', '"undefined"', '"number"'], correctAnswer: 1, points: 1 },
            { text: 'Which keyword declares a block-scoped variable that cannot be reassigned?', options: ['var', 'let', 'const', 'static'], correctAnswer: 2, points: 1 },
            { text: 'What is the result of `[1, 2, 3].map(n => n * 2)`?', options: ['[1, 2, 3]', '[2, 4, 6]', '6', '[1, 4, 9]'], correctAnswer: 1, points: 1 },
            { text: 'Which operator checks both value and type equality?', options: ['==', '=', '===', '!='], correctAnswer: 2, points: 1 },
            { text: 'What does `Array.prototype.includes` return?', options: ['The index of the element', 'A boolean', 'The element itself', 'A new array'], correctAnswer: 1, points: 1 },
            { text: 'Which of these creates a Promise that is already resolved?', options: ['new Promise()', 'Promise.resolve(value)', 'Promise.all([])', 'async()'], correctAnswer: 1, points: 2 },
            { text: 'What will `console.log(0.1 + 0.2 === 0.3)` print?', options: ['true', 'false', 'undefined', 'NaN'], correctAnswer: 1, points: 2 },
            { text: 'Arrow functions do NOT have their own…', options: ['parameters', 'return value', '`this` binding', 'body'], correctAnswer: 2, points: 2 }
        ]
    },
    {
        teacher: 'omar',
        title: 'HTML & CSS Essentials',
        description: 'Semantic HTML, the box model, Flexbox and responsive layout basics.',
        duration: 15,
        passingScore: 60,
        questions: [
            { text: 'Which element represents the main navigation of a page?', options: ['<div>', '<nav>', '<menu>', '<section>'], correctAnswer: 1, points: 1 },
            { text: 'In the CSS box model, which property adds space INSIDE the border?', options: ['margin', 'padding', 'outline', 'gap'], correctAnswer: 1, points: 1 },
            { text: 'Which value of `display` turns an element into a flex container?', options: ['block', 'inline', 'flex', 'grid-flex'], correctAnswer: 2, points: 1 },
            { text: 'What does `box-sizing: border-box` change?', options: ['Width includes padding and border', 'Removes the border', 'Adds a shadow', 'Centers the box'], correctAnswer: 0, points: 2 },
            { text: 'Which attribute makes an image accessible to screen readers?', options: ['title', 'src', 'alt', 'aria-hidden'], correctAnswer: 2, points: 1 },
            { text: 'Which CSS rule applies styles only on screens up to 600px wide?', options: ['@media (min-width: 600px)', '@media (max-width: 600px)', '@screen 600px', '@supports (width: 600px)'], correctAnswer: 1, points: 2 }
        ]
    },
    {
        teacher: 'mona',
        title: 'Algebra I — Linear Equations',
        description: 'Solving one-variable equations, slopes and systems of two linear equations.',
        duration: 25,
        passingScore: 50,
        questions: [
            { text: 'Solve for x: 3x + 5 = 20', options: ['3', '5', '7', '15'], correctAnswer: 1, points: 1 },
            { text: 'What is the slope of the line y = 4x − 2?', options: ['−2', '2', '4', '−4'], correctAnswer: 2, points: 1 },
            { text: 'Solve for x: 2(x − 3) = 10', options: ['2', '5', '8', '13'], correctAnswer: 2, points: 1 },
            { text: 'Which point lies on the line y = 2x + 1?', options: ['(1, 3)', '(2, 4)', '(0, 2)', '(3, 6)'], correctAnswer: 0, points: 1 },
            { text: 'Solve the system: x + y = 10, x − y = 2', options: ['x = 6, y = 4', 'x = 4, y = 6', 'x = 5, y = 5', 'x = 8, y = 2'], correctAnswer: 0, points: 2 },
            { text: 'The line through (0, 1) and (2, 5) has slope…', options: ['1', '2', '3', '4'], correctAnswer: 1, points: 2 },
            { text: 'Which equation is parallel to y = −3x + 7?', options: ['y = 3x + 7', 'y = −3x − 1', 'y = (1/3)x + 7', 'y = 7'], correctAnswer: 1, points: 2 }
        ]
    },
    {
        teacher: 'mona',
        title: 'Geometry Basics',
        description: 'Angles, triangles, area and perimeter of common shapes.',
        duration: 20,
        passingScore: 60,
        questions: [
            { text: 'The interior angles of a triangle add up to…', options: ['90°', '180°', '270°', '360°'], correctAnswer: 1, points: 1 },
            { text: 'Area of a rectangle 8 cm by 5 cm?', options: ['13 cm²', '26 cm²', '40 cm²', '45 cm²'], correctAnswer: 2, points: 1 },
            { text: 'A right triangle has legs 3 and 4. The hypotenuse is…', options: ['5', '6', '7', '12'], correctAnswer: 0, points: 2 },
            { text: 'Circumference of a circle with radius r?', options: ['πr²', '2πr', 'πd²', 'r²/2'], correctAnswer: 1, points: 1 },
            { text: 'How many degrees in each interior angle of a regular hexagon?', options: ['108°', '120°', '135°', '150°'], correctAnswer: 1, points: 2 }
        ]
    },
    {
        teacher: 'youssef',
        title: 'English Grammar — Tenses',
        description: 'Present, past and perfect tenses in everyday English.',
        duration: 15,
        passingScore: 70,
        questions: [
            { text: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], correctAnswer: 1, points: 1 },
            { text: 'They ___ the movie last night.', options: ['watch', 'have watched', 'watched', 'are watching'], correctAnswer: 2, points: 1 },
            { text: 'I ___ here since 2020.', options: ['live', 'lived', 'have lived', 'am living'], correctAnswer: 2, points: 2 },
            { text: 'Look! It ___ outside.', options: ['rains', 'is raining', 'rained', 'has rained'], correctAnswer: 1, points: 1 },
            { text: 'By the time we arrived, the train ___.', options: ['left', 'has left', 'had left', 'leaves'], correctAnswer: 2, points: 2 },
            { text: 'Choose the correct question: ___ you finished your homework?', options: ['Did', 'Have', 'Are', 'Do'], correctAnswer: 1, points: 1 }
        ]
    },
    {
        teacher: 'youssef',
        title: 'General Science — The Solar System',
        description: 'Planets, the Sun and basic astronomy facts.',
        duration: 10,
        passingScore: 60,
        questions: [
            { text: 'Which planet is closest to the Sun?', options: ['Venus', 'Mercury', 'Earth', 'Mars'], correctAnswer: 1, points: 1 },
            { text: 'Which planet is known as the Red Planet?', options: ['Jupiter', 'Saturn', 'Mars', 'Neptune'], correctAnswer: 2, points: 1 },
            { text: 'What is the largest planet in the Solar System?', options: ['Saturn', 'Jupiter', 'Uranus', 'Earth'], correctAnswer: 1, points: 1 },
            { text: 'Roughly how long does light from the Sun take to reach Earth?', options: ['8 seconds', '8 minutes', '8 hours', '8 days'], correctAnswer: 1, points: 2 },
            { text: 'What keeps the planets in orbit around the Sun?', options: ['Magnetism', 'Gravity', 'Solar wind', 'Friction'], correctAnswer: 1, points: 1 }
        ]
    }
];
