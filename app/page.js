{stage === "build" && (
  <section style={styles.card}>
    <div style={styles.sectionHeader}>
      <div>
        <div style={styles.sectionTitle}>🎨 Flyer Generator</div>

        <div style={styles.muted}>
          Tell BOMBA AI about your business. We will handle the flyer design for you.
        </div>
      </div>

      <span style={styles.badge}>AI FLYER</span>
    </div>

    <div style={styles.field}>
      <label style={styles.label}>Business / Brand Name *</label>

      <input
        style={styles.input}
        placeholder="Example: Kingsley Sneakers"
        value={project.businessName}
        onChange={(e) =>
          update("businessName", e.target.value)
        }
      />
    </div>

    <div style={styles.field}>
      <label style={styles.label}>
        What does your business sell or offer? *
      </label>

      <textarea
        style={styles.textareaSmall}
        placeholder="Example: We sell premium sneakers for everyday style."
        value={project.description}
        onChange={(e) =>
          update("description", e.target.value)
        }
      />
    </div>

    <div style={styles.field}>
      <label style={styles.label}>Product / Service Name *</label>

      <input
        style={styles.input}
        placeholder="Example: Premium Sneakers"
        value={project.headline}
        onChange={(e) =>
          update("headline", e.target.value)
        }
      />
    </div>

    <div style={styles.twoColumns}>
      <div style={styles.field}>
        <label style={styles.label}>Price</label>

        <input
          style={styles.input}
          placeholder="Example: ₦25,000"
          value={project.price}
          onChange={(e) =>
            update("price", e.target.value)
          }
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>WhatsApp / Phone *</label>

        <input
          style={styles.input}
          placeholder="Example: 2348067955573"
          value={project.whatsapp}
          onChange={(e) =>
            update("whatsapp", e.target.value)
          }
        />
      </div>
    </div>

    <div style={styles.field}>
      <label style={styles.label}>Location (Optional)</label>

      <input
        style={styles.input}
        placeholder="Example: Port Harcourt, Nigeria"
        value={project.location || ""}
        onChange={(e) =>
          update("location", e.target.value)
        }
      />
    </div>

    <div style={styles.field}>
      <label style={styles.label}>
        Special Message (Optional)
      </label>

      <textarea
        style={styles.textareaSmall}
        placeholder="Example: Order now • Limited stock available"
        value={project.specialMessage || ""}
        onChange={(e) =>
          update("specialMessage", e.target.value)
        }
      />
    </div>

    <div style={styles.field}>
      <label style={styles.label}>
        Product Picture (Optional)
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImage}
        style={{ display: "none" }}
      />

      <button
        style={styles.secondaryButton}
        onClick={() =>
          fileInputRef.current?.click()
        }
      >
        {project.image
          ? "✓ Change Product Picture"
          : "📷 Upload Product Picture"}
      </button>

      {project.image && (
        <div
          style={{
            marginTop: "10px",
            color: "#35d07f",
            fontSize: "12px",
          }}
        >
          ✓ Product picture added
        </div>
      )}
    </div>

    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        background: "#111",
        border: "1px solid #252525",
        borderRadius: "13px",
      }}
    >
      <div
        style={{
          color: "#FFD43B",
          fontWeight: 900,
          fontSize: "13px",
          marginBottom: "5px",
        }}
      >
        ✨ BOMBA AI will handle the design
      </div>

      <div
        style={{
          color: "#888",
          fontSize: "12px",
          lineHeight: 1.5,
        }}
      >
        You don't need to choose colors, fonts, layouts or arrange
        the flyer yourself. BOMBA AI will prepare the professional
        design from your information.
      </div>
    </div>

    <div style={styles.actionRow}>
      <button
        style={styles.secondaryButton}
        onClick={() => setStage("describe")}
      >
        ← Back
      </button>

      <button
        style={styles.primaryButton}
        onClick={openPreview}
      >
        ✨ Generate My Flyer
      </button>
    </div>
  </section>
)}