/*
  Althrough the checksum using destination is implemented:
  Do not use destination 64, because the wrapper at frame builder is not implemented.  
  This checksum is strongly recommended to use only broadcast.
  For this reason, the section which calculates destination 64 is commented.  
*/

var BufferReader = require('buffer-reader');
exports.chksum = function(frameObj) {
    function removeCarry(sum) {
        remove_carry = 0x10000 & sum;
        //console.log('sum',sum.toString(16));
        if (0 < remove_carry) {
            sum++;
            //remove carry
            sum &= 0xFFFF;
            //console.log('sum',sum.toString(16));
        }
        return sum;
    }
    /* Sample to frameObj 

    var frameObj = {
        type: 0xFE, // NEW 6LOWPAN FRAME IPHC
        sendPort: 0x223d,
        dstPort:0x223d,        
        id: 0x01, // optional, nextFrameId() is called per default
        options: 0x00, // optional, 0x00 is default
        source64: "0013a20040c90d18",//mac address as source, string and 16bit
        destination64:"0013a20040c90d18",//mac address as destination, string and 16bit
        data: "0123456789" // It has to be string
    }*/
    // INFORMATIONS: (PORTUGUESE AND ENGLISH)
    // ADICIONAR 0xFE80 +0x0200 + 0x11 AO SUM DE ENDEREÇO (QUE É 64 BIT LONG -- PROPER MAC ADDRESS) --- ENDEREÇO IPV6
    // ADD 0XFE80 +0x0200 + 0X11 TO SUM OF THE ADDRESS( IT MUST BE 64 BIT LONG -- PROPER MAC ADDRESS) -- IPV6 ADDRESS 
    // ADICIONAR FF03 AO SUM DE ENDEREÇO -- BROADCAST
    // ADD FF03 TO ADDRESS SUM -- BROADCAST, OTHERWISE CALCULATE THE SUM OF THE DEST. ADDRESS
    // UIP LENGTH = 0x8 + data length --- SOMA-SE DUAS VEZES AO SUM TOTAL-- TWO ADDITIONS IS NEEDED
    // DATA SHOULD BE ADDED AS 16BIT, IF THERE IS ODD NUMBER THIS SHOULD BE ADDED AS DATA[0]<<8 + 0
    // HOW DO YOU DOING ??? PRETTY FINE I HOPE
    // LET'S START
    var address = new Buffer(frameObj.source64);
    var data = new Buffer(frameObj.data);
    var reader = new BufferReader(address);
    //USE OF READER IS TO PERFOME FAST CONVERSIONS
    var size = address.length;
    var sum = 0;
    var t;
    var remove_carry;
    //common proto FOR ALL 
    sum += 0x0011;
    data_length = data.length;
    uip_length = parseInt((8 + data_length).toString(16), 16);
    //sum uip length
    sum += uip_length;
    //console.log('uip_length:',uip_length.toString(16));
    //console.log('sum:',sum.toString(16));

    //6LOWPAN ADD
    // As it is a ipv6 address:
    sum += 0xFE80;
    sum += 0x0200;
    sum = removeCarry(sum);

    //as address it is a common size, interaction gonna work:
    for (var i = 0; i < size; i += 4) {
        t = parseInt(reader.nextString(4), 16);
        //console.log('t',t.toString(16));
        sum += t;
        //console.log('sum',sum.toString(16));
        sum = removeCarry(sum);
        //console.log('sum:',sum.toString(16));
    }
    //Is there a dst64?
    /*if (frameObj.destination64) {
        var dest = new Buffer(frameObj.destination64);
        size = dest.length;
        var readerDST = new BufferReader(dest);
        // As it is a ipv6 address:
        sum += 0xFE80;
        sum += 0x0200;
        sum = removeCarry(sum);
        //dest as it is a common size gonna work this loop:
        for (var i = 0; i < size; i += 4) {
            t = parseInt(readerDST.nextString(4), 16);
            //console.log('t',t.toString(16));
            sum += t;
            //console.log('sum',sum.toString(16));
            sum = removeCarry(sum);
            //console.log('sum:',sum.toString(16));
        }
    } else {*/
    //BROADCAST
    sum += 0xff03;
    sum = removeCarry(sum);

    //}
    //console.log('sum:',sum.toString(16));
    // sum header source
    sum += frameObj.sendPort
    sum = removeCarry(sum);
    sum += frameObj.dstPort
    sum = removeCarry(sum);
    sum += uip_length;
    sum = removeCarry(sum);

    //sum data as well
    reader = new BufferReader(data);
    var i;

    for (i = 0; i + 1 < data_length; i += 2) {
        sum += (data[i] << 8) + data[i + 1];
        //console.log('T',((data[i]<<8)+data[i+1]).toString(16));  
        sum = removeCarry(sum);
    }

    if (i + 1 == data_length) {
        sum += data[i] << 8;
        remove_carry = 0x10000 & sum;
        //console.log('sum',sum.toString(16));
        sum = removeCarry(sum);
    }
    //chck sum is:
    //console.log('checksum:',(sum ^0xFFFF).toString(16));
    //return sum
    return sum ^ 0xFFFF;
};
/*
var dataptr =[0xF,0xE,0x8,0x0,0x0,0x2,0x1,0x3,0xA,0x2,0x0,0x0,0x4,0x0,0xC,0x9,0x0,0xA,0x7,0x1,0xF,0xF,0x0,0x2,0x0,0x0,0x0,0x1];

var length = dataptr.length;
var i = 0;
var sum = 0x23;
while (i< length){
  var t = (dataptr[i]<<12)+(dataptr[i+1]<<8)+(dataptr[i+2]<<4)+(dataptr[i+3]);
  //console.log('t : '+t.toString(16));
  sum+=t;
  //console.log('Sum: ',sum.toString(16));
  if (sum < t){
    //console.log('message');
    sum++;
  }
  i+=4;
}
//console.log('Sum total:',sum.toString(16));

*/