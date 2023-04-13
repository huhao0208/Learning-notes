
/**
 *  宏任务:  整段script setTimeOut setInterval i/o操作(输入输出 比如读取文件操作 网络请求)、ui render(DOM渲染) 、异步ajax等
 *  微任务: Promise(then catch finally)、 async/await process nextTick Object.observe MutationObserver(监听DOM树的变化)
 * 执行顺序: 
 * 1.先执行同步代码  
 * 2.遇到异步宏任务,将异步宏任务放到宏任务队列中 
 * 3.遇到异步微任务,将其放到异步微任务队列中
 * 4.同步任务执行完毕后 将异步微任务队列执行完毕
 * 5.再执行宏任务队列
 * 6.每个宏任务执行完毕后检查是否有待执行的微任务,如果有则执行完微任务再执行下一个宏任务
 * 7.循环至所有任务执行完毕,完成一次时间循环 EventLoop
 * 8. 宏任务执行顺序 setImmediate --> setTimeout --> setInterval --> i/o操作 --> 异步ajax 
 * 9.setImmediate没有时间参数，它与延迟 0 毫秒的 setTimeout() 回调⾮常相似。所以当setTimeout延迟时间也是0毫秒时，谁在前面就先执行谁。此外如果setTimeout延迟时间不是0毫秒，它的执行顺序会在 i/o 操作之后
 * 10. 微任务执行顺序 process.nextTick --> Promise
 * 
 */


// 练习1

setTimeout(function () {
    console.log('1');
})
new Promise(function (resolve) {
    console.log('2');
    resolve();
}).then(function () {
    console.log('3');
})
console.log('4');

/**
 * 分析练习1
 * 0. 执行宏任务script片段,添加到宏任务队列[script1], 应为再无其他任务,直接执行宏任务 script1, script1 先顺序(同步任务)执行
 * 1. 遇到setTimeout,这是个宏任务,添加到宏任务队列:[timer1]
 * 2. 遇到new Promise(new Promise 在实例化过程中所执⾏的代码都是同步执⾏的（ function 中的代码）) 函数 执行他  发现里面有同步任务 执行console.log(2)  发现有.then 将其添加到微任务队列:[then1] 
 * 3.发现console.log(4) 执行他
 * 4.执行微任队列:[then1]   [console.log(3)]
 * 5.执行下一个宏任务 timer1 console.log(1)
 * 所以最终结果是 2 4 3 1
 */

// 练习2

console.log(1);
setTimeout(function () {
    console.log(2);
    let promise = new Promise(function (resolve, reject) {
        console.log(3);
        resolve();
    }).then(function () {
        console.log(4);
    });
}, 1000);
setTimeout(function () {
    console.log(5);
    let promise = new Promise(function (resolve, reject) {
        console.log(6);
        resolve();
    }).then(function () {
        console.log(7);
    });
}, 0);
let promise = new Promise(function (resolve, reject) {
    console.log(8);
    resolve()
}).then(function () {
    console.log(9);
}).then(function () {
    console.log(10)
});
console.log(11);


/**
 * 分析练习2
 * 1.执行console.log(1)                                                             // 1
 * 2.将setTimeout1 放入宏队列:[setTimeout1]             
 * 3.将setTimeout2 放入宏队列:[setTimeout1,setTimeout2]             
 * 4.执行newPromise console.log(8)                                                  // 8
 * 5.发现then1 将then1(log(9))放入微任务队列:[then1]
 * 6.发现then2 将then2(log(10)) 放入微任务队列:[then1,then2]
 * 7.执行console.log(11)                                                            // 11
 * 8.执行微任务队列 then1 then2  console.log(9) console.log(10) ,微任务队列清空     // 9 10 
 * 9.微任务队列清空:[],执行下一个宏任务setTimeout2( 这里选宏任务setTime2是因为他时间是最短的)
 * 10. 执行console.log(5)                                                           // 5
 * 11. 执行console.log(6)                                                            //6       
 * 12. 将then7加入微任务队列
 * 13. 当前宏任务同步任务完成,顺序执行微任务 执行console.log(7),微任务队列清空       //7
 * 14.执行下一个宏任务setTimeout1,console.log(2);console.log(3);                    // 2 3
 * 15.console.log(4);                                                              // 4         
 * 所以最终顺序为 1 8 11 9 10 5 6 7 2 3 4                
 */


// 练习3
let axios = require('axios');
const { log } = require('console');
let fs = require('fs');
console.log('begin');
fs.readFile('1.txt', (err, data) => {
    console.log('fs');
});
axios.get('https://api.muxiaoguo.cn/api/xiaohua?api_key=fd3270a0a9833e20').then(res => {
    console.log('axios');
});
setTimeout(() => {
    console.log('setTimeout')
}, 0);
setImmediate(() => {
    console.log('setImmediate');
});
(async function () {
    console.log('async')
})();
console.log('end');

/**
 * 分析练习3
 * 1.console.log('begin');
 * 2.遇到fs操作,将其放入宏任务队列:{i/o操作: [fs]}
 * 3.遇到axios请求,将其放入宏任务队列:{i/o操作: [fs],ajax:[axios]}
 * 4.遇到setTimeout 将其放入宏任务队列          {setTimeout:[setTimeout0],   i/o操作: [fs],ajax:[axios]}
 * 5.遇到setImmediate 将其放入宏任务队列 {setImmediate:[setImmediate], setTimeout:[setTimeout],   i/o操作: [fs],ajax:[axios]}
 * 6.执行 立即执行函数 console.log('async')
 * 7.console.log('end')
 * 8.没有微任务队列.执行宏任务 执行顺序:    setTimeout->setImmediate->fs->axios   
 * 所以最终结果是 begin  async  end setTimeout setImmediate fs axios
 *  如果(setTimeout setInterval)时间为0 setImmediate 三者按顺序执行 否则定时器在i/o操作之后 
 */


// 练习4 微任务
console.log('begin');
Promise.resolve().then(() => {
    console.log('promise');
    return Promise.resolve()
}).then(()=>{
    console.log('done');
})

process.nextTick(() => {
    console.log('nextTick');
    Promise.resolve().then(() => {
        console.log('promise3');
        
    })
});

Promise.resolve().then(() => {
    console.log('promise1');
    return Promise.resolve()
})
console.log('end');


/**
 * 练习4
 *  console.log('begin')
 * 添加.then 到微任务队列:[promise]
 * 添加process.nextTick 到任务队列[promise,nextTick1]
 * console.log('end')
 * 执行微任务 优先顺序 先找出nexttick 执行完毕再执行promise console.log(nextTick) console.log(promise)
 * 所以最终结果  begin end nextTick promise
 */
