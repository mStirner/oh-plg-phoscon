# Introduction
This is a boilerplate plugin.

# Installation
1) Create a new plugin over the OpenHaus backend HTTP API
2) Mount the plugin source code folder into the backend
3) run `npm install`

# Development
Add plugin item via HTTP API:<br />
[PUT] `http://{{HOST}}:{{PORT}}/api/plugins/`
```json
{
   "name":"Phoscon Integration",
   "version": "1.0.0",
   "intents":[
      "devices",
      "endpoints",
      "store",
      "vault",
      "ssdp"
   ],
   "uuid": "6453b600-19d5-4a5d-ac33-517960f2ff88"
}
```
Mount the source code into the backend plugins folder
```sh
sudo mount --bind ~/projects/OpenHaus/plugins/oh-plg-phoscon/ ~/projects/OpenHaus/backend/plugins/6453b600-19d5-4a5d-ac33-517960f2ff88/
```
