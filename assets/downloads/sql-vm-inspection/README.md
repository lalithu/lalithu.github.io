# SQLi VM source extraction

A portable adaptation of the Python extraction and NTFS inventory scripts used in the investigation. It reads the original archive or a separate offline disk copy, extracts the NetBeans project, and records file hashes. It does not execute the guest or its application.

Use Python 3.9 or later:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python extract_vm_source.py --archive /path/to/SQLi-UTM.tar.gz --output ./inspection --inventory
```

The output directory must not already exist. The archive option copies only the expected disk member into the new directory; it does not unpack arbitrary archive paths. Allow enough disk space for the separate QCOW2 copy. No disk file is booted or mounted for writing.

If you already extracted a separate offline disk:

```sh
.venv/bin/python extract_vm_source.py --disk /path/to/offline-copy.qcow2 --output ./inspection
```

Outputs: `SQLInjection/`, `manifest.json`, and optionally `candidates.json`. Candidate filenames are leads, not findings. The optional MFT scan includes an in-use flag; it does not recover all deleted data. The helper is specific to the lab's verified guest project path.

The post's broader findings also involved content inspection, SQLite queries against an extracted browser history database, comparison of older Java files, and reading Recycle Bin metadata and MySQL Workbench scratch/history files. This helper reproduces source extraction and candidate enumeration, not that entire analysis. It contains no VM, instructor source, credentials, or solution data.
