
export const delay = (time: number) => {
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
};

export const waitForRender = () => {
    return new Promise(requestAnimationFrame);
};