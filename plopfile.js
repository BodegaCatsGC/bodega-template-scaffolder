const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');

module.exports = function(plop) {
  const TEMPLATE_REPO = 'https://github.com/BodegaCatsGC/GITHUB-PROJECT-TEMPLATE.git';
  const CACHE_DIR = path.join(__dirname, '.template-cache');
  const SPARSE_PATHS = [
    'templates/managed',
    'templates/common',
    'templates/docs',
    'templates/obsidian',
    'templates/docker', // Added docker folder
    'templates/tests',
    'templates/python-library',
    'templates/node-service',
    'templates/full-stack-react'
  ];

  // Sparse-clone once
  if (!fs.existsSync(CACHE_DIR)) {
    execSync(`git clone --depth=1 --filter=blob:none --sparse ${TEMPLATE_REPO} ${CACHE_DIR}`);
    execSync(`git -C ${CACHE_DIR} sparse-checkout set ${SPARSE_PATHS.join(' ')}`);
  }

  plop.setGenerator('project', {
    description: 'Scaffold a new repo from the upstream Bodega Project Template',
    prompts: [
      { type: 'input',  name: 'name',         message: 'Project name (folder will be created):' },
      { type: 'list',   name: 'projectType',  message: 'Select project type:', choices: ['Python Library','Node Service','Full-Stack React'] },
      { type: 'confirm',name: 'includeTests', message: 'Include tests folder?',            default: true }
    ],
    actions: function(data) {
      const dest = path.join(process.cwd(), data.name);
      const actions = [];

      // managed, docs, obsidian, common, docker (local dev env)
      ['managed','docs','obsidian','common','docker'].forEach(folder => {
        actions.push({
          type: 'addMany',
          base: path.join(CACHE_DIR, 'templates', folder),
          destination: folder === 'common' ? dest : path.join(dest, folder),
          templateFiles: path.join(CACHE_DIR, 'templates', folder, '**')
        });
      });

      // project-type
      const typeMap = {
        'Python Library':   'python-library',
        'Node Service':     'node-service',
        'Full-Stack React': 'full-stack-react'
      };
      actions.push({
        type: 'addMany',
        base: path.join(CACHE_DIR, 'templates', typeMap[data.projectType]),
        destination: dest,
        templateFiles: path.join(CACHE_DIR, 'templates', typeMap[data.projectType], '**')
      });

      // optional tests
      if (data.includeTests) {
        actions.push({
          type: 'addMany',
          base: path.join(CACHE_DIR, 'templates', 'tests'),
          destination: path.join(dest, 'tests'),
          templateFiles: path.join(CACHE_DIR, 'templates', 'tests', '**')
        });
      }

      return actions;
    }
  });
};
