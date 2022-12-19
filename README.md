# Introduction
Plugin that integrates the [Phoscon/RaspBee](https://dresden-elektronik.github.io/deconz-rest-doc/getting_started/) API into OpenHaus.

# Features
- [x] Discover device
- [x] Pair device
- [x] Store access key in vault
- [x] Fetch lights/sensors from gateway
- [x] Store lights/sensors in openhaus
- [x] Setup command/state handling
- [ ] Sync endponits every then and now

# Installation
1) Create a new plugin over the OpenHaus backend HTTP API
2) Upload the *.tgz content to the file upload endpoint
3) Go to the Gateway settings page and put it in "paring" mode
4) Update the store item "pairing" to true
5) The plugin accuieres a API Key from the gateway
6) Pairing/Installation complete

# Links
- https://phoscon.de/de/raspbee/install
- https://dresden-elektronik.github.io/deconz-rest-doc/
- https://github.com/OpenHausIO/backend