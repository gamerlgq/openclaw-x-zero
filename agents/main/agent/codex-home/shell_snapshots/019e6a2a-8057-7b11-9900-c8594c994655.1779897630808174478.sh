# Snapshot file
# Unset all aliases to avoid conflicts with functions
# Functions
gawklibpath_append () 
{ 
    [ -z "$AWKLIBPATH" ] && AWKLIBPATH=`gawk 'BEGIN {print ENVIRON["AWKLIBPATH"]}'`;
    export AWKLIBPATH="$AWKLIBPATH:$*"
}
gawklibpath_default () 
{ 
    unset AWKLIBPATH;
    export AWKLIBPATH=`gawk 'BEGIN {print ENVIRON["AWKLIBPATH"]}'`
}
gawklibpath_prepend () 
{ 
    [ -z "$AWKLIBPATH" ] && AWKLIBPATH=`gawk 'BEGIN {print ENVIRON["AWKLIBPATH"]}'`;
    export AWKLIBPATH="$*:$AWKLIBPATH"
}
gawkpath_append () 
{ 
    [ -z "$AWKPATH" ] && AWKPATH=`gawk 'BEGIN {print ENVIRON["AWKPATH"]}'`;
    export AWKPATH="$AWKPATH:$*"
}
gawkpath_default () 
{ 
    unset AWKPATH;
    export AWKPATH=`gawk 'BEGIN {print ENVIRON["AWKPATH"]}'`
}
gawkpath_prepend () 
{ 
    [ -z "$AWKPATH" ] && AWKPATH=`gawk 'BEGIN {print ENVIRON["AWKPATH"]}'`;
    export AWKPATH="$*:$AWKPATH"
}

# setopts 3
set -o braceexpand
set -o hashall
set -o interactive-comments

# aliases 0

# exports 40
declare -x CODEX_HOME="/home/ubuntu/.openclaw/agents/main/agent/codex-home"
declare -x CODEX_MANAGED_BY_NPM="1"
declare -x DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/1000/bus"
declare -x GOPROXY="https://mirrors.tencent.com/go,direct"
declare -x GSM_SKIP_SSH_AGENT_WORKAROUND="true"
declare -x HOME="/home/ubuntu"
declare -x HTTPS_PROXY="http://127.0.0.1:7890"
declare -x HTTP_PROXY="http://127.0.0.1:7890"
declare -x INVOCATION_ID="a0c0878a7fd445d5aad913bf44805738"
declare -x JOURNAL_STREAM="8:126299"
declare -x LANG="en_US.UTF-8"
declare -x LOGNAME="ubuntu"
declare -x MANAGERPID="1055"
declare -x MEMORY_PRESSURE_WATCH="/sys/fs/cgroup/user.slice/user-1000.slice/user@1000.service/app.slice/openclaw-gateway.service/memory.pressure"
declare -x MEMORY_PRESSURE_WRITE="c29tZSAyMDAwMDAgMjAwMDAwMAA="
declare -x NODE_EXTRA_CA_CERTS="/etc/ssl/certs/ca-certificates.crt"
declare -x NO_PROXY=""
declare -x OPENCLAW_GATEWAY_PORT="18789"
declare -x OPENCLAW_PATH_BOOTSTRAPPED="1"
declare -x OPENCLAW_PROXY_ACTIVE="1"
declare -x OPENCLAW_PROXY_LOOPBACK_MODE="gateway-only"
declare -x OPENCLAW_SERVICE_KIND="gateway"
declare -x OPENCLAW_SERVICE_MARKER="openclaw"
declare -x OPENCLAW_SERVICE_VERSION="2026.5.18"
declare -x OPENCLAW_SYSTEMD_UNIT="openclaw-gateway.service"
declare -x OPENCLAW_WINDOWS_TASK_NAME="OpenClaw Gateway"
declare -x PATH="/home/ubuntu/.local/bin:/home/ubuntu/.openclaw/agents/main/agent/codex-home/tmp/arg0/codex-arg0fmMtfO:/home/ubuntu/.openclaw/extensions/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/path:/home/ubuntu/.nvm/versions/node/v24.14.0/bin:/usr/bin:/bin:/home/ubuntu/.nvm/current/bin:/home/ubuntu/.local/bin:/home/ubuntu/.npm-global/bin:/home/ubuntu/bin:/home/ubuntu/.nix-profile/bin:/usr/local/bin:/snap/bin"
declare -x QT_ACCESSIBILITY="1"
declare -x SHELL="/bin/bash"
declare -x SHLVL="1"
declare -x SSH_AUTH_SOCK="/run/user/1000/gnupg/S.gpg-agent.ssh"
declare -x SYSTEMD_EXEC_PID="22129"
declare -x TMPDIR="/tmp"
declare -x TST_HACK_BASH_SESSION_ID="175103301588254"
declare -x USER="ubuntu"
declare -x XDG_DATA_DIRS="/usr/local/share/:/usr/share/:/var/lib/snapd/desktop"
declare -x XDG_RUNTIME_DIR="/run/user/1000"
declare -x http_proxy="http://127.0.0.1:7890"
declare -x https_proxy="http://127.0.0.1:7890"
declare -x no_proxy=""
