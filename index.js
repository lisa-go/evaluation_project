//console.log("hello world")

/* 
  client side
    template: static template
    logic(js): MVC(model, view, controller): used to server side technology, single page application
        model: prepare/manage data,
        view: manage view(DOM),
        controller: business logic, event bindind/handling

  server side
    json-server
    CRUD: create(post), read(get), update(put, patch), delete(delete)


*/

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

//IIFE
//todos
/* 
    hashMap: faster to search
    array: easier to iterate, has order


*/
const Model = (() => {
  class State {
    #todos; //private field
    #onChange; //function, will be called when setter function todos is called
    constructor() {
      this.#todos = [];
    }
    get todos() {
      return this.#todos;
    }
    set todos(newTodos) {
      // reassign value
      console.log('setter function');
      this.#todos = newTodos;
      this.#onChange?.(); // rendering
    }

    subscribe(callback) {
      //subscribe to the change of the state todos
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
  const todolistEl = document.querySelector('.todo-list');
  const submitBtnEl = document.querySelector('.submit-btn');
  const inputEl = document.querySelector('.input');

  const renderTodos = (todos) => {
    let todosTemplate = '';
    todos.forEach((todo) => {
      const liTemplate = `<li><span>${todo.content}</span><input type="text" value="${todo.content}" class="edit-input hidden" id="${todo.id}"/><button class="edit-btn" id="${todo.id}">edit</button><button class="delete-btn" id="${todo.id}">delete</button></li>`;
      todosTemplate += liTemplate;
    });
    if (todos.length === 0) {
      todosTemplate = '<h4>no task to display!</h4>';
    }
    todolistEl.innerHTML = todosTemplate;
  };

  const clearInput = () => {
    inputEl.value = '';
  };

  return { renderTodos, submitBtnEl, inputEl, clearInput, todolistEl };
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
      const inputValue = view.inputEl.value;
      model
        .createTodo({ content: inputValue, completed: false })
        .then((data) => {
          state.todos = [data, ...state.todos];
          view.clearInput();
          console.log(state);
        });
    });
  };

  const handleDelete = () => {
    view.todolistEl.addEventListener('click', (event) => {
      if (event.target.className === 'delete-btn') {
        const id = event.target.id;
        console.log('id', typeof id);
        model.deleteTodo(+id).then((data) => {
          state.todos = state.todos.filter((todo) => todo.id !== +id);
        });
      }
    });
  };

  const handleEdit = () => {
    view.todolistEl.addEventListener('click', (event) => {
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
            .then(
              (data) => (
                (body = data),
                (body.content = event.target.previousElementSibling.value)
              )
            )
            .then((res) => {
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

  const bootstrap = () => {
    init();
    handleSubmit();
    handleDelete();
    handleEdit();
    state.subscribe(() => {
      view.renderTodos(state.todos);
    });
  };
  return {
    bootstrap,
  };
})(View, Model); //ViewModel

Controller.bootstrap();
