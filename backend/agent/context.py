import contextvars

current_parent_id = contextvars.ContextVar("current_parent_id", default=None)
current_student_id = contextvars.ContextVar("current_student_id", default=None)
current_class_id = contextvars.ContextVar("current_class_id", default=None)
