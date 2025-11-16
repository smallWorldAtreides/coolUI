import './style.scss'

document.addEventListener('DOMContentLoaded', () => {
    const interBubble = document.querySelector<HTMLDivElement>('.interactive')!;
    const bubbles = Array.from(document.querySelectorAll<HTMLDivElement>('.g1, .g2, .g3, .g4, .g5'));
    let curX = 0, curY = 0;
    let tgX = 0, tgY = 0;

console.log(bubbles, interBubble);

let wobbleAngle = 0;


    function move() {
        curX += (tgX - curX) / 15;
        curY += (tgY - curY) / 15;
        wobbleAngle += 0.1;
        const wobbleX = Math.sin(wobbleAngle * 0.9) * 0.15 + 1; 
        const wobbleY = Math.cos(wobbleAngle * 0.7) * 0.1 + 1;
        interBubble.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px) scale(${wobbleX}, ${wobbleY})`;
        

        bubbles.forEach(b => {
            const rect = b.getBoundingClientRect();
            const interRect = interBubble.getBoundingClientRect();

            const collides = !(rect.right < interRect.left ||
                               rect.left > interRect.right ||
                               rect.bottom < interRect.top ||
                               rect.top > interRect.bottom);

            if (collides) {
                b.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px) scale(${wobbleX}, ${wobbleY})`;
            } else {
                b.classList.add('active');
            }
        });

        requestAnimationFrame(move);
    }

    window.addEventListener('mousemove', (event) => {
        tgX = event.clientX;
        tgY = event.clientY;
    });

    move();
});
