// Canvas 渲染器 - 用于生成图片
class CanvasRenderer {
    constructor() {
        this.width = 1240;
        this.height = 620;
        this.canvas = null;
        this.ctx = null;
        this.images = {};
        this.font = null;
    }

    // 预加载所有需要的图片
    async preloadImages(result) {
        const imagesToLoad = [
            { key: 'background', src: './starimg/background.png' },
            { key: 'background5', src: './starimg/background5.png' }
        ];

        // 添加背景装饰图
        if (result.backgroundImage) {
            imagesToLoad.push({ key: 'bgDecoration', src: `./starimg/${result.backgroundImage}` });
        }

        // 添加签文图片
        if (result.textImage) {
            imagesToLoad.push({ key: 'textImg', src: `./starimg/${result.textImage}` });
        }

        const loadPromises = imagesToLoad.map(({ key, src }) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    this.images[key] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Failed to load image: ${src}`);
                    resolve(); // 继续执行，即使某些图片加载失败
                };
                img.src = src;
            });
        });

        await Promise.all(loadPromises);
    }

    // 创建 Canvas
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d');
    }

    // 绘制带颜色的背景层
    drawColoredBackground(colorHex) {
        if (!this.images.background) return;

        const ctx = this.ctx;

        // 创建临时 canvas 用于处理遮罩
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;
        const tempCtx = tempCanvas.getContext('2d');

        // 绘制遮罩图片
        tempCtx.drawImage(this.images.background, 0, 0, this.width, this.height);

        // 获取图片数据
        const imageData = tempCtx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;

        // 将颜色转换为 RGB
        const rgb = this.hexToRgb(colorHex);

        // 用颜色替换非透明像素
        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha > 0) {
                data[i] = rgb.r;
                data[i + 1] = rgb.g;
                data[i + 2] = rgb.b;
                data[i + 3] = Math.floor(alpha * 0.8); // 80% 不透明度
            }
        }

        tempCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0);
    }

    // 绘制背景装饰层
    drawBackgroundDecoration() {
        if (!this.images.background5) return;

        // 先绘制 background5.png
        this.ctx.drawImage(this.images.background5, 0, 0, this.width, this.height);

        // 如果有额外的装饰图，绘制它
        if (this.images.bgDecoration) {
            this.ctx.drawImage(this.images.bgDecoration, 0, 0, this.width, this.height);
        }
    }

    // 绘制签文图片
    drawTextImage() {
        if (!this.images.textImg) return;

        const x = Math.floor(this.width * 0.204);
        const y = Math.floor(this.height * 0.49);

        this.ctx.drawImage(this.images.textImg, x, y);
    }

    // 绘制文字
    drawTexts(result) {
        const ctx = this.ctx;
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'top';

        // 根据全局字体设置选择字体
        const fontFamily = (typeof currentFont !== 'undefined' && currentFont === 'simli')
            ? '"隶书", SimLi, serif'
            : '"霞鹜文楷", "LXGW WenKai Mono", serif';

        // 文字区域位置
        const textAreaX = Math.floor(this.width * (1 - 0.35)) - 40 - 133;

        // 文字内容
        const texts = [
            { text: result.dordas, size: 40 },
            { text: result.dordasColor, size: 40 },
            { text: result.blessing, size: 45 },
            { text: result.entry, size: 40 }
        ];

        // 行间距
        const lineSpacings = [20, 60, 85];

        // 计算总高度
        const totalHeight = 40 * 3 + 45 + lineSpacings.reduce((a, b) => a + b, 0);
        let currentY = Math.floor((this.height - totalHeight) / 2) + 29;

        texts.forEach((item, i) => {
            if (item.text) {
                ctx.font = `${item.size}px ${fontFamily}`;
                ctx.fillText(item.text, textAreaX, currentY);

                if (i < lineSpacings.length) {
                    currentY += (i === 2 ? 45 : 40) + lineSpacings[i];
                }
            }
        });
    }

    // 渲染完整图片
    async render(result) {
        // 预加载图片
        await this.preloadImages(result);

        // 创建 Canvas
        this.createCanvas();

        // 按顺序绘制各层
        this.drawColoredBackground(result.colorHex);
        this.drawBackgroundDecoration();
        this.drawTextImage();
        this.drawTexts(result);

        return this.canvas;
    }

    // 导出为 Blob
    async toBlob() {
        return new Promise((resolve) => {
            this.canvas.toBlob(resolve, 'image/png');
        });
    }

    // 导出为 Base64
    toBase64() {
        return this.canvas.toDataURL('image/png').split(',')[1];
    }

    // 辅助函数：十六进制转 RGB
    hexToRgb(hex) {
        hex = hex.replace('#', '');
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        };
    }
}
