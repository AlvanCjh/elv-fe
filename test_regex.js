function parseRange(idString) {
    let match1 = idString.match(/^(.*?)\s+(\d+)\s+to\s+(\d+)$/i);
    if (match1) return { format: 'to', prefix1: match1[1].trim(), startNum: match1[2], prefix2: match1[1].trim(), endNum: match1[3] };
    
    let match2 = idString.match(/^(.*?)(\d+)\s*-\s*(.*?)(\d+)$/i);
    if (match2) return { format: 'prefix-num-prefix-num', prefix1: match2[1].trim(), startNum: match2[2], prefix2: match2[3].trim(), endNum: match2[4] };

    let match3 = idString.match(/^(.*?)(\d+)\s*-\s*(\d+)$/i);
    if (match3) return { format: 'prefix-num-num', prefix1: match3[1].trim(), startNum: match3[2], prefix2: match3[1].trim(), endNum: match3[3] };
    
    return null;
}

const tests = ['CAM01 - CAM17', 'CS1-L5-16 - CS1-L5-38', 'SPEAKER-L5 1 to 10', 'CAM01-17'];
tests.forEach(t => console.log(t, '=>', parseRange(t)));
