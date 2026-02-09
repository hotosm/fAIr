### Systemd templates

Services required to setup fAIr in VM ( Dev env ).

if frontend is hosted with nginx :

```bash
sudo systemctl restart fAIr-app && sudo nginx -t && sudo systemctl restart nginx 
```
