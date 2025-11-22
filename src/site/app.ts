import { toPng } from 'html-to-image';

const generateCardImage = (id: string) => {
    const element = document.querySelector<HTMLElement>(".card");
    if (!element) {
        throw new Error("Could not find card element.");
    }
    toPng(element).then((dataUrl) => {
        // Display the image
        // const img = new Image();
        // img.src = dataUrl;
        // document.body.appendChild(img);

        // Download the image
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${id}.png`;
        link.click();
    })
        .catch((err) => {
            console.error('oops, something went wrong!', err);
        });
}

document.querySelector<HTMLElement>(".submit-button")?.addEventListener("click", () => {
    generateCardImage("MyCard");
});