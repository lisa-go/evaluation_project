// Siying Goh (Lisa)

function myFetch(url, method, ...args) {
  return new Promise((res, rej) => {
    const xhr = new XMLHttpRequest();

    if (method == 'PUT') {
      xhr.open(method, url, true);
    } else {
      xhr.open(method || 'GET', url);
    }
    xhr.responseType = 'json';
    if (method == 'POST' || method == 'PUT') {
      var body = JSON.stringify(args[0]);
      xhr.setRequestHeader('Content-type', 'application/json; charset=utf=8');
    }
    xhr.onload = function () {
      res(xhr.response);
    };
    xhr.onerror = function () {
      rej('error');
    };
    xhr.send(body ? body : undefined);
  });
}

const APIs = (() => {
  const createTodo = (newTodo) => {
    return myFetch('http://localhost:3000/todos', 'POST', newTodo);
  };

  const changeTodo = (id, editTodo) => {
    return myFetch('http://localhost:3000/todos/' + id, 'PUT', editTodo);
  };

  const deleteTodo = (id) => {
    return myFetch('http://localhost:3000/todos/' + id, 'DELETE');
  };

  const getTodos = () => {
    return myFetch('http://localhost:3000/todos');
  };
  return { createTodo, changeTodo, deleteTodo, getTodos };
})();

const Model = (() => {
  class State {
    #todos;
    #onChange;
    constructor() {
      this.#todos = [];
    }
    get todos() {
      return this.#todos;
    }
    set todos(newTodos) {
      this.#todos = newTodos;
      this.#onChange?.();
    }

    subscribe(callback) {
      this.#onChange = callback;
    }
  }
  const { getTodos, changeTodo, createTodo, deleteTodo } = APIs;
  return {
    State,
    getTodos,
    changeTodo,
    createTodo,
    deleteTodo,
  };
})();

const View = (() => {
  const listContainerEl = document.querySelector('#list-container');
  const todolistEl = document.querySelector('.todo-list');
  const completedListEl = document.querySelector('.completed-list');
  const submitBtnEl = document.querySelector('.submit-btn');
  const inputEl = document.querySelector('.input');

  const renderTodos = (todos) => {
    let todosTemplate = '';
    todos
      .filter((todo) => todo.completed === false)
      .forEach((todo) => {
        const liTemplate =
          `<li><span>${todo.content}</span>` +
          `<input type="text" value="${todo.content}" class="edit-input hidden" id="${todo.id}"/>` +
          `<button class="edit-btn" id="${todo.id}">Edit</button>` +
          `<button class="delete-btn" id="${todo.id}">Delete</button>` +
          `<button class="switch-btn" id="${todo.id}">></button></li>`;
        todosTemplate += liTemplate;
      });
    if (todos.filter((todo) => todo.completed === false).length === 0) {
      todosTemplate = '<h4>no task to display!</h4>';
    }
    todolistEl.innerHTML = todosTemplate;
  };

  const renderCompleted = (todos) => {
    let todosTemplate = '';
    todos
      .filter((todo) => todo.completed === true)
      .forEach((todo) => {
        const liTemplate =
          `<li><button class="switch-btn" id="${todo.id}"><</button>` +
          `<span>${todo.content}</span><input type="text" value="${todo.content}" class="edit-input hidden" id="${todo.id}"/>` +
          `<button class="edit-btn" id="${todo.id}">Edit</button>` +
          `<button class="delete-btn" id="${todo.id}">Delete</button></li>`;
        todosTemplate += liTemplate;
      });
    if (todos.filter((todo) => todo.completed === true).length === 0) {
      todosTemplate = '<h4>no task to display!</h4>';
    }
    completedListEl.innerHTML = todosTemplate;
  };

  const clearInput = () => {
    inputEl.value = '';
  };

  return {
    renderTodos,
    renderCompleted,
    submitBtnEl,
    inputEl,
    clearInput,
    todolistEl,
    listContainerEl,
  };
})();

const Controller = ((view, model) => {
  const state = new model.State();
  const init = () => {
    model.getTodos().then((todos) => {
      todos.reverse();
      state.todos = todos;
    });
  };

  const handleSubmit = () => {
    view.submitBtnEl.addEventListener('click', (event) => {
      const inputValue = view.inputEl.value.trim();
      if (inputValue === '') return;
      model
        .createTodo({ content: inputValue, completed: false })
        .then((data) => {
          state.todos = [data, ...state.todos];
          view.clearInput();
        });
    });
  };

  const handleDelete = () => {
    view.listContainerEl.addEventListener('click', (event) => {
      if (event.target.className === 'delete-btn') {
        const id = event.target.id;
        model.deleteTodo(+id).then((data) => {
          state.todos = state.todos.filter((todo) => todo.id !== +id);
        });
      }
    });
  };

  const handleEdit = () => {
    view.listContainerEl.addEventListener('click', (event) => {
      let id = event.target.id;
      if (event.target.className === 'edit-btn') {
        const id = event.target.id;
        event.target.previousElementSibling.classList.toggle('show');
        if (
          event.target.previousElementSibling.classList.contains('show') ===
          true
        ) {
          event.target.previousElementSibling.previousElementSibling.style.display =
            'none';
        } else {
          event.target.previousElementSibling.previousElementSibling.style.display =
            'flex';

          var body;
          myFetch('http://localhost:3000/todos/' + event.target.id)
            .then((data) => {
              body = data;
            })
            .catch((err) => {
              if (event.target.previousElementSibling.value == data.content) {
                return Promise.reject();
              }
            })
            .then((res) => {
              body.content = event.target.previousElementSibling.value;
              model.changeTodo(+id, body);
            })
            .then((data) => {
              let copy = [...state.todos];
              copy.splice(-body.id, 1, body);
              state.todos = [...copy];
            });
        }
      }
    });
  };

  const handleSwitch = () => {
    view.listContainerEl.addEventListener('click', (event) => {
      if (event.target.className === 'switch-btn') {
        const id = event.target.id;

        var body;
        myFetch('http://localhost:3000/todos/' + event.target.id)
          .then((data) => {
            body = data;
            body.completed = !data.completed;
          })
          .then((res) => {
            model.changeTodo(+id, body);
          })
          .then((data) => {
            let copy = [...state.todos];
            copy.splice(-body.id, 1, body);
            state.todos = [...copy];
          });
      }
    });
  };

  const bootstrap = () => {
    init();
    handleSubmit();
    handleDelete();
    handleEdit();
    handleSwitch();
    state.subscribe(() => {
      view.renderTodos(state.todos);
      view.renderCompleted(state.todos);
    });
  };
  return {
    bootstrap,
  };
})(View, Model);

Controller.bootstrap();
