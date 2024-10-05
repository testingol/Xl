const {readfiledata,readquerydata,readproxydata,httpsapi,cmdtitle,sleep,waiting,countdown,nowlog,fNumber,readbotdata, counttime} = require('./aapi_request.js')
const proxyfile = 'proxy.txt'
const proxylist = readfiledata(proxyfile)

const botname = "NOTPXL"
const {queryfile,tokenfile}  = readbotdata(botname)
const queryids = readfiledata(queryfile)

const redpxl = "#BE0039"
const yellowpxl = "#FFD635"
const xStart = 700;
const yStart = 625;
const xEnd = 1000;
const yEnd = 825;

function isYellowpixel (x, y, PixelOutline){
    let isInside = false
    for (let i = 0, j = PixelOutline.length - 1; i < PixelOutline.length; j = i++) {
        const xi = PixelOutline[i][0], yi = PixelOutline[i][1]
        const xj = PixelOutline[j][0], yj = PixelOutline[j][1]
        const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside
}

function pixelData() {
    const redPixels = [];
    for (let x = xStart; x < xEnd; x++) {
        for (let y = yStart; y < yEnd; y++) {
            redPixels.push({x,y}); //All pixels red
        }
    }
    const centerX = (xEnd + xStart) / 2;
    const centerY = (yEnd + yStart) / 2;
    const starRadius = Math.min(xEnd - xStart, yEnd - yStart)/3;

    const step = (2 * Math.PI) / 5;
    const innerRadius = starRadius / 2.5;
    const PixelOutline = [];
    const yellowPixels = [];

    for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? starRadius : innerRadius;
        const angle = i * step - Math.PI / 2;
        const px = Math.floor(centerX + Math.cos(angle) * r);
        const py = Math.floor(centerY + Math.sin(angle) * r);
        PixelOutline.push([px,py]); // Outer pixels yellow
    }

    for (let x = xStart; x < xEnd; x++) {
        for (let y = yStart; y < yEnd; y++) {
            const isyellow = isYellowpixel(x,y,PixelOutline)
            if(isyellow){
                yellowPixels.push({x,y}) // Inner pixels yellow
                const pixelIndex = redPixels.findIndex(p => p.x === x && p.y === y);
                if (pixelIndex !== -1) {
                    redPixels.splice(pixelIndex, 1); // Remove pixels yellow
                }
            }
        }     
    }
    return {redPixels,yellowPixels}
}

function VietnamFlag (redPixels,yellowPixels){
    const selectRed = redPixels[Math.floor(Math.random()*redPixels.length)]
    const redpixel = selectRed.x*1000+selectRed.y
    const selectYellow = yellowPixels[Math.floor(Math.random()*yellowPixels.length)]
    const yellowpixel = selectYellow.x*1000+selectYellow.y
    return {redpixel,yellowpixel}
}

class BOT{
    constructor(){
        this.headers = {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "no-cache",
            "pragma": "no-cache",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Microsoft Edge\";v=\"129\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"129\", \"Microsoft Edge WebView2\";v=\"129\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "Referer": "https://app.notpx.app/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        }
    }
    
    async getuserstate(callHeaders,proxy){
        const url = 'https://notpx.app/api/v1/users/me';
        try{
            const response = await httpsapi("GET",url,callHeaders,proxy,null,5000)
            nowlog("Login Successful!",'success');
            return response.data            
        }catch(error){
            nowlog(`Error Login!, ${error.message}`,'error');
            return null
        }   
    }
    
    async getuserstatus(callHeaders,proxy){
        const url = 'https://notpx.app/api/v1/mining/status';
        try{
            const response = await httpsapi("GET",url,callHeaders,proxy,null,5000)
            nowlog("Get Status Successful!",'success');
            return response.data            
        }catch(error){
            nowlog(`Error Get Status, ${error.message}`,'error');
            return null
        }   
    }

    async repaint(callHeaders,proxy,pixelid,color){
        const url = 'https://notpx.app/api/v1/repaint/start';
        const payload = {pixelId: pixelid, newColor: color}
        try{
            await httpsapi("POST",url,callHeaders,proxy,payload,5000)
            nowlog("Repaint Successful!",'success');
            return true
        }catch(error){
            nowlog(`Error Repaint!, ${error.message}`,'error');
            return false
        }   
    }
    async getpaint(callHeaders,proxy,pixelid){
        const url = `https://notpx.app/api/v1/image/get/${pixelid}`;
        try{
            const response = await httpsapi("GET",url,callHeaders,proxy,null,5000)
            nowlog("Get Paint Color Successful!",'success');
            return response.data.pixel.color         
        }catch(error){
            nowlog(`Error Get Paint Color!, ${error.message}`,'error');
            return null
        }   
    }
    async claimmine(callHeaders,proxy){
        const url = `https://notpx.app/api/v1/mining/claim`;
        try{
            await httpsapi("GET",url,callHeaders,proxy,null,5000)
            return true       
        }catch(error){
            nowlog(`Error Get Paint Color!, ${error.message}`,'error');
            return false
        }   
    }
    
    async main() {
        console.clear()
        await countdown(5,botname)
        while (true) {
            let time = 3000
            for(let i = 0; i < queryids.length; i++){
                const {user,queryid}= readquerydata(queryids,i);
                const proxy = await readproxydata(proxylist,i)
                nowlog(`${botname} BOT: Run User[${i+1}] - ID: ${user.id}`,'special')
                cmdtitle(user.id,botname)
                const callHeaders={...this.headers,"authorization": `initData ${queryid}`}

                try{
                    const user = await this.getuserstate(callHeaders,proxy)
                    const status = await this.getuserstatus(callHeaders,proxy)
                    nowlog(`=====/ ${botname} FARMING /=====`);                
                    nowlog(`Balance : ${fNumber(user.balance).green} $${botname}`);
                    nowlog(`Energy : ${fNumber((status.charges)).green} / ${fNumber((status.maxCharges)).green}`);
                    time = status.reChargeTimer/1000

                    const {redPixels,yellowPixels} = pixelData()
                    let change = status.charges
                    while(change>0){
                        const {redpixel,yellowpixel} = VietnamFlag(redPixels,yellowPixels)
                        const checkred = await this.getpaint(callHeaders,proxy,redpixel)
                        nowlog(`Checking... Red Position [${redpixel}]`,"warning")
                        if(checkred !== redpxl){
                            await sleep(2)
                            const status = await this.repaint(callHeaders,proxy,redpixel,redpxl)
                            if(status){
                                change -= 1
                            }
                        }

                        if(change===0){
                            break
                        }

                        await waiting(5,botname)
                        const checkyellow = await this.getpaint(callHeaders,proxy,yellowpixel)
                        nowlog(`Checking... Yellow Position [${yellowpixel}]`,"warning")
                        if(checkyellow !== yellowpxl){
                            await sleep(2)
                            const status = await this.repaint(callHeaders,proxy,yellowpixel,yellowpxl)
                            if(status){
                                change -= 1
                            }
                        }
                    }
                }catch(error){
                    nowlog(`Error Get Data User ${user.id}!, ${error.message}`,'error');
                    await waiting(5,botname)
                }
            }
            await countdown(time,botname)
        }
    }
}

if (require.main === module) {
    const bot = new BOT();
    bot.main().catch(error => {
        nowlog(`${error.message}`,'error');
    });
}