#!/usr/bin/env python3
"""Extract source from an offline SQLi lab disk. Adapted from the investigation scripts.

Reads the supplied archive/disk; writes only into a newly created output directory.
Never pass a running VM's disk. Use an original archive or an offline copy.
"""
import argparse
import hashlib
import json
import shutil
import tarfile
from pathlib import Path

from dissect.target import Target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    inputs = parser.add_mutually_exclusive_group(required=True)
    inputs.add_argument('--archive', type=Path, help='Original SQLi-UTM.tar.gz')
    inputs.add_argument('--disk', type=Path, help='Separate offline QCOW2 copy')
    parser.add_argument('--output', required=True, type=Path, help='New directory; must not exist')
    parser.add_argument('--inventory', action='store_true', help='Also list candidate NTFS records')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)

    if args.archive:
        disk = args.output / 'original-copy.qcow2'
        found = False
        with tarfile.open(args.archive, 'r|gz') as archive:
            for member in archive:
                if member.isfile() and member.name.endswith('/Data/SQLi-fvm32-disk.qcow2'):
                    with archive.extractfile(member) as source, disk.open('xb') as destination:
                        shutil.copyfileobj(source, destination)
                    found = True
                    break
        if not found:
            raise SystemExit('Expected lab QCOW2 member not found in archive')
    else:
        disk = args.disk.resolve()

    target = Target.open(str(disk))
    project = target.fs.path('/sysvol/Users/test/Downloads/SQLInjection')
    manifest = []
    for file in project.rglob('*'):
        if not file.is_file():
            continue
        relative = Path(str(file)[len(str(project)) + 1:])
        if relative.is_absolute() or '..' in relative.parts:
            raise ValueError('Unsafe guest path')
        destination = args.output / 'SQLInjection' / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        data = file.read_bytes()
        destination.write_bytes(data)
        manifest.append({
            'guest_path': 'C:' + str(file)[len('/sysvol'):].replace('/', '\\'),
            'output': str(destination.relative_to(args.output)),
            'size': len(data),
            'sha256': hashlib.sha256(data).hexdigest(),
        })
    (args.output / 'manifest.json').write_text(json.dumps(manifest, indent=2))

    if args.inventory:
        candidates = []
        total = 0
        for record in target.fs.mounts['sysvol'].ntfs.mft.segments():
            total += 1
            try:
                names = record.filenames(ignore_dos=True)
                if any(any(term in name.lower() for term in
                           ['answer', 'solution', 'sqli', 'xss', '.sql', '.scratch']) for name in names):
                    candidates.append({'paths': record.full_paths(ignore_dos=True),
                                       'in_use': bool(record.header.Flags & 1)})
            except Exception:
                continue
        (args.output / 'candidates.json').write_text(json.dumps(
            {'mft_records': total, 'filename_candidates': candidates}, indent=2))
    print(f'Extracted {len(manifest)} project files into {args.output}')


if __name__ == '__main__':
    main()
