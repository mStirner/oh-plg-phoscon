const raw = require("raw-socket");

/*
const icmp = raw.createSocket({
    protocol: raw.Protocol.ICMP
});

// Ziel-IP-Adresse, die du pingen möchtest
const targetIP = '192.168.2.1';

// ICMP Echo Request erstellen
const icmpPacket = Buffer.alloc(8);
icmpPacket[0] = 8; // ICMP-Typ: 8 für Echo Request
icmpPacket[1] = 0; // ICMP-Code: 0 für Echo Request
icmpPacket.writeUInt16BE(0, 2); // ICMP-Prüfsumme: 0 (wird später berechnet)
icmpPacket.writeUInt16BE(0, 4); // ICMP-Identifier: 0 (kann beliebig gewählt werden)
icmpPacket.writeUInt16BE(0, 6); // ICMP-Sequenznummer: 0 (kann beliebig gewählt werden)

// Berechne ICMP Prüfsumme
function calculateChecksum(buffer) {
    let checksum = 0;
    for (let i = 0; i < buffer.length; i += 2) {
        checksum += buffer.readUInt16BE(i);
    }
    checksum = (checksum & 0xffff) + (checksum >> 16);
    return ~checksum & 0xffff;
}
icmpPacket.writeUInt16BE(calculateChecksum(icmpPacket), 2); // Setze die berechnete Prüfsumme zurück

// Sende den ICMP Echo Request
icmp.send(icmpPacket, 0, icmpPacket.length, targetIP, function (err, bytes) {
    if (err) {
        console.error('Fehler beim Senden des ICMP-Pakets:', err);
    } else {
        console.log('ICMP-Paket erfolgreich gesendet:', bytes, 'Bytes gesendet.', icmpPacket);
    }
});

// Empfange die ICMP-Antwort
icmp.on('message', function (buffer, source) {
    console.log('ICMP-Antwort empfangen von:', source, buffer);
    // Verarbeite die empfangene ICMP-Antwort hier
});

// Behandele Fehler beim Empfangen von ICMP-Antworten
icmp.on('error', function (err) {
    console.error('Fehler beim Empfangen von ICMP-Antworten:', err);
});
*/

function calculateChecksum(buffer) {
    let checksum = 0;
    for (let i = 0; i < buffer.length; i += 2) {
        checksum += buffer.readUInt16BE(i);
    }
    checksum = (checksum & 0xffff) + (checksum >> 16);
    return ~checksum & 0xffff;
}

function parse(type, code) {

    let obj = {};
    const ECHOMessageType = ['REPLY', 'NA', 'NA', 'DESTINATION_UNREACHABLE', 'SOURCE_QUENCH', 'REDIRECT'];
    const DestinationUnreachableCode = ['NET', 'HOST', 'PROTOCOL', 'PORT', 'FRAGMENTATION', 'ROUTE_FAILED', 'NET_UNKNOWN', 'HOST_UNKNOWN', 'HOST_ISOLATED', 'NET_PROHIBITED', 'HOST_PROHIBITED', 'NET_UNREACHABLE', 'HOST_UNREACHABLE', 'COMM_PROHIBITED', 'HOST_PRECEDENCE', 'PRECEDENCE_CUTOFF'];
    const RedirectCode = ['NETWORK', 'HOST', 'SERVICE_NETWORK', 'HOST_NETWORK'];

    obj.type = 'OTHER';
    obj.code = 'NO_CODE';

    obj.open = (type === 0);

    if (type < ECHOMessageType.length) {
        obj.type = ECHOMessageType[type];
    }

    switch (type) {
        case 3: obj.code = DestinationUnreachableCode[code]; break;
        case 5: obj.code = RedirectCode[code]; break;
    }

    return obj;

}


module.exports = (info, logger, init) => {
    return init([
        "devices"
    ], async (scope, [
        C_DEVICES
    ]) => {


        C_DEVICES.found({
            labels: [
                "ping=true",
                "test=true",
                "net=imcp"
            ]
        }, (device) => {

            logger.info(`Device "${device.name}" found, try to ping it...`);

            let iface = device.interfaces[0];
            let { host, port } = iface.settings;

            let start = 0;
            const NS_PER_SEC = 1e9;

            iface.once("attached", () => {


                iface.once("data", (data) => {
                    console.log(`Data received from raw://${host}`, data);

                    let diff = process.hrtime(start);
                    let elapsed = (diff[0] + diff[1] / NS_PER_SEC) * 1000;

                    const offset = 20;
                    const type = data.readUInt8(offset);
                    const code = data.readUInt8(offset + 1);

                    console.log(parse(type, code), elapsed);

                });

                const icmpPacket = Buffer.alloc(8);
                icmpPacket[0] = 8; // ICMP-Typ: 8 für Echo Request
                icmpPacket[1] = 0; // ICMP-Code: 0 für Echo Request
                icmpPacket.writeUInt16BE(0, 2); // ICMP-Prüfsumme: 0 (wird später berechnet)
                icmpPacket.writeUInt16BE(0, 4); // ICMP-Identifier: 0 (kann beliebig gewählt werden)
                icmpPacket.writeUInt16BE(0, 6); // ICMP-Sequenznummer: 0 (kann beliebig gewählt werden)
                icmpPacket.writeUInt16BE(calculateChecksum(icmpPacket), 2);

                iface.write(icmpPacket, () => {
                    console.log("Data written to", `raw://${host}`, icmpPacket)
                    start = process.hrtime();
                });

            });

        }, async (filter) => {

            let device = await C_DEVICES.add({
                ...filter,
                name: "ICMP Ping Test",
                interfaces: [{
                    settings: {
                        socket: "raw",
                        host: "192.168.2.1",
                        port: 1,
                    }
                }]
            })

            logger.info(`Device "${device.name}" added`);

        });


    });
};