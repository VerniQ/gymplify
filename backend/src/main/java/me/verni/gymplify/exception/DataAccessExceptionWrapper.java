package me.verni.gymplify.exception;

public class DataAccessExceptionWrapper extends RuntimeException {
  public DataAccessExceptionWrapper(String message) {
    super(message);
  }

  public DataAccessExceptionWrapper(String message, Throwable cause) {
    super(message, cause);
  }
}