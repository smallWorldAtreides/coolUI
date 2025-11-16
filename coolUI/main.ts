import './style.scss'

document.addEventListener('DOMContentLoaded', () => {
    const interBubble = document.querySelector<HTMLDivElement>('.interactive')!;
    const bubbles = Array.from(document.querySelectorAll<HTMLDivElement>('.g1, .g2, .g3, .g4, .g5'));
    const bg = document.querySelector<HTMLDivElement>('.gradient-bg')!;
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


            const miniBlob = b.querySelector<HTMLElement>('::before') as HTMLElement;
            
            if (collides) {
                b.classList.add('active'); // CSS Pulsation/Verformung

                // Goo-Pull: Bubble leicht in Richtung Maus ziehen
                const bCenterX = rect.left + rect.width / 2;
                const bCenterY = rect.top + rect.height / 2;

                const dx = tgX - bCenterX;
                const dy = tgY - bCenterY;

                const pullFactor = 50; // Stärke des Pull-Effekts
                b.style.transform = `translate(${dx * pullFactor}px, ${dy * pullFactor}px)`;
            } else {
                b.classList.remove('active');
                b.style.transform = ''; // Zurücksetzen
            }
        });

   

            const xPercent = (tgX / window.innerWidth) * 100;
            const yPercent = (tgY / window.innerHeight) * 100;
            bg.style.background = `radial-gradient(circle at ${xPercent}% ${yPercent}%, var(--color-bg1), var(--color-bg2))`;


        requestAnimationFrame(move);
    }

    window.addEventListener('mousemove', (event) => {
        tgX = event.clientX;
        tgY = event.clientY;
    });
    

    move();
});
