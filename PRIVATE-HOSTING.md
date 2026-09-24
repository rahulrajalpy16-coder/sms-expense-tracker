# Private hosting plan

## GitHub
The repository remains private and is the controlled source/backup location.

## Why ordinary GitHub Pages is not enabled
For a personal repository, ordinary GitHub Pages does not provide the requested owner-only access model. A private repository can still publish a publicly reachable Pages site depending on plan; private Pages access control is an Enterprise Cloud capability.

## Zero-cost private runtime
Use the Windows local launcher with Tailscale Serve:

```powershell
tailscale serve --bg 8787
```

Tailscale will provide an HTTPS URL inside the tailnet and proxy it to the local service at `127.0.0.1:8787`.

The URL is available only to users/devices allowed by the tailnet ACL/share policy. Do not enable Tailscale Funnel because Funnel is for public internet exposure.

## Sharing later
Invite/selectively allow another Tailscale user/device. Remove their access when no longer needed. GitHub source access can separately be controlled with repository collaborators.
