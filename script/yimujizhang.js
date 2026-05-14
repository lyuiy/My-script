let obj = JSON.parse($response.body);

if (obj.result) {
    obj.result.vipTime = 4092599349000;
    obj.result.vipType = 2;
}

$done({
    body: JSON.stringify(obj)
});
