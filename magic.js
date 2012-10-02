
function hashstr(txt, seed) {
	var hash = seed;
        txt="asdf"+txt;
	for (i = 0; i < txt.length; i++) {
		char = txt.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
        return Math.abs(hash);
}

function norm(x) {
  return Math.abs(x)/2147483648;
}

var binops=["*", "*", "*", "*", "|", "&", "+", ">>", ">>", ">>", ">>", "<<"]

function xxxgenerate_oneliner(text, seed, depth) {
  // operator
  var x=hashstr(text, seed);
  var op=binops[Math.abs(x)%binops.length];
  var opshift=(op==">>" || op=="<<");
  // recursion probability
  var pr=1.0/depth;
  // left argument
  var lhs, lhs_const=false;
  x=hashstr(text, x);
  var p=norm(x);
  if (p<.2 && !opshift && op!="|") {
    lhs=''+((Math.abs(x)%15)+1);
    lhs_const=true;
  }
  else if (p<.2+pr) {
    lhs=generate_oneliner(text, x+1, depth+1);
  }
  else {
    lhs='t';
  }
  // right argument
  x=hashstr(text, x);
  p=norm(x);
  if (lhs!='t' && p<.7-pr) {
    rhs='t';
  }
  else if ((p<.3 || opshift) && !lhs_const && op!="|") {
    rhs=''+((Math.abs(x)%15)+1);
  }
  else {
    rhs=generate_oneliner(text, x+2, depth+1);
  }
  return '('+lhs+op+rhs+')'
}

var lib=['t*(((t>>12)|(t>>8))&63&(t>>4))',
         '(t*((t>>5)|(t>>8)))>>(t>>16)',
         '((((t>>6)|t)|(t>>(t>>16)))*10)+(((t>>11))&7)',
         '((t|((t>>9)|(t>>7)))*t)&((t>>11)|(t>>9))',
         '(t&t*(t%255))-(t*3&(t>>13)&(t>>6))',
         '(((t*9)&(t>>4))|((t*5)&(t>>7))|((t*3)&(t>>10)))-1',
         't*(t^(t+(t>>15|1))^((t-1280^t)>>10))',
         '(t*((t>>5)|(t>>8)))>>(t>>16)',
         't*(((t>>9)|(t>>13))&25&(t>>6))',
         't*((t>>11)&(t>>8)&123&(t>>3))',
         't*(t>>(((t>>9)|(t>>8)))&63&(t>>4))',
         '(((t>>7)|t|(t>>6))*10)+4*(t&(t>>13)|(t>>6))',
         '((t>>3)>>8)*(t>>6))',
         '((t|(12*t))>>8)>>2',
         '(((t+t)>>10)+((t*(t>>7))>>11))>>1',
         '(((t*t)>>3)*t)>>7',
         '(t*((t>>5)|(t>>8)))>>7',
         '((t>>(12*t)>>2)>>3)',
         '((((t>>6)*t)>>7*t)>>11)',
        ]

function generate_oneliner(text, seed, depth) {
  seed=hashstr(text, seed);
  var f=lib[Math.abs(seed)%lib.length];
  console.log(f);
  seed=hashstr(text, seed);
  var num=(Math.abs(seed)%6)+5;
  while (num--) {
    // splice
    seed=hashstr(text, seed);
    var o=random_subexpr(lib[Math.abs(seed)%lib.length], text, seed);
    seed=hashstr(text, seed);
    if (norm(seed)<.5) {
        var tmp=o; o=f; f=tmp;
    }
    seed=hashstr(text, seed);
    f=random_subexpr(f, text, seed, o);
    console.log(f);
  }
  console.log('**');
  return f;
}

function random_subexpr(expr, text, seed, subst) {
  var x=hashstr(text, seed);
  var nn=expr.split('(').length-1;
  var n=(Math.abs(x)%nn)+1;
  var np=n;
  var i=-1;
  while (n--) {
      i=expr.indexOf('(',i+1);
  }
  n=0;
  for (var j=i; j<expr.length; j++) {
      if (expr[j]=='(')
          n++;
      else if (expr[j]==')') {
          n--;
          if (!n) {
              if (subst==undefined) {
                  // cut
                  console.log('cut '+np+'/'+nn+': '+expr.substr(0, i)+' X[ '+expr.substr(i, j+1-i)+' ]X '+expr.substr(j+1));
                  return expr.substr(i, j+1-i);
              }
              else {
                  // splice
                  console.log('splice '+np+'/'+nn+': '+expr.substr(0, i)+' [+] '+subst+' [+] '+expr.substr(j+1));
                  return expr.substr(0, i)+subst+expr.substr(j+1);
              }
          }
      }
  }
  alert('fail!');
}

// Code in ~2 hours by Bemmu, idea and sound code snippet from Viznut.

function makeSampleFunction(text) {
    var oneLiner = generate_oneliner(text, 0xDEADBEEF, 1);
    var oneLiner = oneLiner.replace(/sin/g, "Math.sin");
    var oneLiner = oneLiner.replace(/cos/g, "Math.cos");
    var oneLiner = oneLiner.replace(/tan/g, "Math.tan");
    var oneLiner = oneLiner.replace(/floor/g, "Math.floor");
    var oneLiner = oneLiner.replace(/ceil/g, "Math.ceil");
    
    if (window.console) {
	console.log(oneLiner);
    }

    eval("var f = function (t) { return " + oneLiner + "}");
    return f;
}

function generateSound(text) {
    var frequency = 8000;
    var seconds = 180;

    var sampleArray = [];
    var f = makeSampleFunction(text);
    
    for (var t = 0; t < frequency*seconds; t++) {
        // Between 0 - 65535
//        var sample = Math.floor(Math.random()*65535);
        
        var sample = (f(t)) & 0xff;
        sample *= 256 *.5;
        if (sample < 0) sample = 0;
        if (sample > 65535) sample = 65535;
        
        sampleArray.push(sample);
    }
    return [frequency, sampleArray];
}

// [255, 0] -> "%FF%00"
function b(values) {
    var out = "";
    for (var i = 0; i < values.length; i++) {
        var hex = values[i].toString(16);
        if (hex.length == 1) hex = "0" + hex;
        out += "%" + hex;
    }
    return out.toUpperCase();
}

// Character to ASCII value, or string to array of ASCII values.
function c(str) {
    if (str.length == 1) {
        return str.charCodeAt(0);
    } else {
        var out = [];
        for (var i = 0; i < str.length; i++) {
            out.push(c(str[i]));
        }
        return out;
    }
}

function split32bitValueToBytes(l) {
    return [l&0xff, (l&0xff00)>>8, (l&0xff0000)>>16, (l&0xff000000)>>24];
}


function FMTSubChunk(channels, bitsPerSample, frequency) {
    var byteRate = frequency * channels * bitsPerSample/8;
    var blockAlign = channels * bitsPerSample/8;
    return [].concat(
        c("fmt "),
        split32bitValueToBytes(16), // Subchunk1Size for PCM
        [1, 0], // PCM is 1, split to 16 bit
        [channels, 0], 
        split32bitValueToBytes(frequency),
        split32bitValueToBytes(byteRate),
        [blockAlign, 0],
        [bitsPerSample, 0]
    );
}

function sampleArrayToData(sampleArray, bitsPerSample) {
    if (bitsPerSample === 8) return sampleArray;
    if (bitsPerSample !== 16) {
        alert("Only 8 or 16 bit supported.");
        return;
    }
    
    var data = [];
    for (var i = 0; i < sampleArray.length; i++) {
        data.push(0xff & sampleArray[i]);
        data.push((0xff00 & sampleArray[i])>>8);
    }
    return data;
}

function dataSubChunk(channels, bitsPerSample, sampleArray) {
    return [].concat(
        c("data"),
        split32bitValueToBytes(sampleArray.length * channels * bitsPerSample/8),
        sampleArrayToData(sampleArray, bitsPerSample)
    );
}

function chunkSize(fmt, data) {
    return split32bitValueToBytes(4 + (8 + fmt.length) + (8 + data.length));
}
    
function RIFFChunk(channels, bitsPerSample, frequency, sampleArray) {
    var fmt = FMTSubChunk(channels, bitsPerSample, frequency);
    var data = dataSubChunk(channels, bitsPerSample, sampleArray);
    var header = [].concat(c("RIFF"), chunkSize(fmt, data), c("WAVE"));
    return [].concat(header, fmt, data);
}

function makeURL(text) {
    var bitsPerSample = 16;    
    var generated = generateSound(text);
    var frequency = generated[0];
    var samples = generated[1];
    var channels = 1;
    return "data:audio/x-wav," + b(RIFFChunk(channels, bitsPerSample, frequency,samples));    
}
    
var el;

function stop() {
    if (el) document.getElementById('player').removeChild(el);
    el = null;
}

function playDataURI(uri) {
    stop();
    el = document.createElement("audio");
    el.setAttribute("autoplay", true);
    el.setAttribute("src", uri);
    el.setAttribute("controls", "controls");
    document.getElementById('player').appendChild(el);
}

function makeSpeech(txt) {
    txt=txt.toLowerCase();
    txt=txt.replace('jukka', 'yuccaa').replace('holm', 'hoalm')
    txt=txt.replace(' ', ', ')
    return generateSpeech(txt, { amplitude:1000, wordgap:1, pitch:30, speed:170 });
}
