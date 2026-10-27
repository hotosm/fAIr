### Systemd templates

Services required to setup fAIr in VM ( Dev env ).

if frontend is hosted with nginx :

```bash
sudo systemctl restart fAIr-app && sudo nginx -t && sudo systemctl restart nginx
```

### Auto-deploy (dev)

`fair-autodeploy.sh` runs every 5 minutes from `fAIr-autodeploy.timer`. It fast-forwards `/opt/fAIr-app` to `origin/develop`, pulls the `:develop` images and runs `docker compose up -d` when the commit or an image differs from the last successful deploy, recorded in `/var/lib/fair-autodeploy/deployed`. A failed deploy leaves that record unchanged, so the next run tries again. The fast-forward stops when a local edit touches a file the update changes, or when the checkout has diverged.

```bash
sudo install -m 755 fair-autodeploy.sh /usr/local/bin/fair-autodeploy.sh
sudo cp fAIr-autodeploy.service fAIr-autodeploy.timer /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now fAIr-autodeploy.timer
```
