from setuptools import setup, find_packages


setup(
    name='super_secret_foundry_test',
    version='0.2.0',
    description='Super secret Foundry test. Already registered.',
    long_description=open('README.rst').read(),
    keywords=[
    ],
    author='Todd Wolfson',
    author_email='todd@twolfson.com',
    url='https://github.com/twolfson/super-secret-foundry-test',
    download_url='https://github.com/twolfson/super-secret-foundry-test/archive/master.zip',
    packages=find_packages(),
    license='UNLICENSE',
    install_requires=open('requirements.txt').readlines(),
    # https://pypi.python.org/pypi?%3Aaction=list_classifiers
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Developers',
        'License :: Public Domain',
        'Operating System :: OS Independent',
        'Programming Language :: Python'
    ]
)
