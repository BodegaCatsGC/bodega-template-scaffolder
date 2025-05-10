const path      = require('path');
const fs        = require('fs-extra');
const { execSync } = require('child_process');

module.exports = function(plop) {
  const TEMPLATE_REPO = 'https://github.com/BodegaCatsGC/GITHUB-PROJECT-TEMPLATE.git';
  const CACHE_DIR     = path.join(__dirname, '.template-cache');
  const SPARSE_PATHS  = [
    'templates/managed',
    'templates/common',
    'templates/docs',
    'templates/obsidian',
    'templates/docker',
    'templates/tests',
    'templates/python-library',
    'templates/node-service',
    'templates/full-stack-react'
  ];

  // 1) clone upstream once, sparse-checkout only the template folders
  if (!fs.existsSync(CACHE_DIR)) {
    execSync(`git clone --depth=1 --filter=blob:none --sparse ${TEMPLATE_REPO} ${CACHE_DIR}`);
    execSync(`git -C ${CACHE_DIR} sparse-checkout set ${SPARSE_PATHS.join(' ')}`);
  }

  plop.setGenerator('project', {
    description: 'Scaffold a new Bodega project',
    prompts: [
      {
        type:    'input',
        name:    'name',
        message: 'Project name (folder will be created):',
      },
      {
        type:    'list',
        name:    'projectType',
        message: 'Select project type:',
        choices: [
          'Python Library',
          'Node Service',
          'Full-Stack React'
        ],
      },
      {
        type:    'confirm',
        name:    'includeTests',
        message: 'Include tests folder?',
        default: true,
      }
    ],
    actions(data) {
      // 2) determine and force-create our dest folder
      const dest = path.join(process.cwd(), data.name);
      fs.ensureDirSync(dest);

      // 3) collect our actions
      const actions = [];

      // Always copy managed, docs, obsidian, docker, common
      ['managed','docs','obsidian','docker','common'].forEach(folder => {
        actions.push({
          type:          'addMany',
          base:          path.join(CACHE_DIR, 'templates', folder),
          destination:   folder === 'common' ? dest : path.join(dest, folder),
          templateFiles: '**/*.*',
          globOptions:   { dot: true, onlyFiles: true },
          stripExtensions: ['hbs'],
        });
      });

      // 4) only copy the chosen codebase
      const typeMap = {
        'Python Library':   'python-library',
        'Node Service':     'node-service',
        'Full-Stack React': 'full-stack-react'
      };
      const chosen = typeMap[data.projectType];
      if (chosen) {
        actions.push({
          type:          'addMany',
          base:          path.join(CACHE_DIR, 'templates', chosen),
          destination:   dest,
          templateFiles: '**/*.*',
          globOptions:   { dot: true, onlyFiles: true },
          stripExtensions: ['hbs'],
        });
      }

      // 5) optionally copy tests
      if (data.includeTests) {
        actions.push({
          type:          'addMany',
          base:          path.join(CACHE_DIR, 'templates', 'tests'),
          destination:   path.join(dest, 'tests'),
          templateFiles: '**/*.*',
          globOptions:   { dot: true, onlyFiles: true },
          stripExtensions: ['hbs'],
        });
      }

      return actions;
    }
  });
};
