#!/usr/bin/env bash
set -euo pipefail

ensure_linux_browser_libs() {
  if [[ "$(uname -s)" != "Linux" ]]; then
    return
  fi

  local -a required_libs=("libnspr4.so" "libnss3.so" "libnssutil3.so")
  local has_all_system_libs=1

  for lib in "${required_libs[@]}"; do
    if ! ldconfig -p 2>/dev/null | grep -q "${lib}"; then
      has_all_system_libs=0
      break
    fi
  done

  if [[ ${has_all_system_libs} -eq 1 ]]; then
    return
  fi

  local cache_root="${XDG_CACHE_HOME:-${HOME}/.cache}/auth-system-playwright-libs"
  local fallback_lib_dir="${cache_root}/usr/lib/x86_64-linux-gnu"

  if [[ ! -f "${fallback_lib_dir}/libnspr4.so" ]] || \
     [[ ! -f "${fallback_lib_dir}/libnss3.so" ]] || \
     [[ ! -f "${fallback_lib_dir}/libnssutil3.so" ]]; then
    if ! command -v apt >/dev/null 2>&1 || ! command -v dpkg-deb >/dev/null 2>&1; then
      echo "Missing Playwright runtime libs. Run: npx playwright install --with-deps" >&2
      return
    fi

    local tmp_dir
    tmp_dir="$(mktemp -d)"
    trap 'rm -rf "${tmp_dir}"' EXIT

    (
      cd "${tmp_dir}"
      apt download libnspr4 libnss3 >/dev/null
      dpkg-deb -x ./libnspr4_*_amd64.deb "${cache_root}"
      dpkg-deb -x ./libnss3_*_amd64.deb "${cache_root}"
    )

    rm -rf "${tmp_dir}"
    trap - EXIT
  fi

  if [[ -d "${fallback_lib_dir}" ]]; then
    export LD_LIBRARY_PATH="${fallback_lib_dir}:${LD_LIBRARY_PATH:-}"
  fi
}

ensure_linux_browser_libs
npx playwright test "$@"
