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
   "name":"Plugin Boilerplate",
   "version":1,
   "intents":[
      "devices",
      "endpoints",
      "plugins",
      "rooms",
      "ssdp",
      "store",
      "users",
      "vault"
   ],
   "uuid": "00000000-0000-0000-0000-000000000000"
}

```
Mount the source code into the backend plugins folder
```sh
sudo mount --bind ~/projects/OpenHaus/plugins/plugin-boilerplate/ ~/projects/OpenHaus/backend/plugins/00000000-0000-0000-0000-000000000000/
```
